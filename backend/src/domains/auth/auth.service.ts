import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { environmentConfig } from '../../config/environment.config';
import { User } from './entities/user.entity';
import { EmailVerificationToken } from './entities/email-verification-token.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { EmailService } from '../../infra/email/email.service';

@Injectable()
export class AuthService {
  private readonly verificationTokenTtlHours = 24;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokensRepository: Repository<EmailVerificationToken>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  private hashVerificationToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async createEmailVerificationToken(userId: string): Promise<string> {
    await this.emailVerificationTokensRepository
      .createQueryBuilder()
      .update(EmailVerificationToken)
      .set({ invalidatedAt: new Date() })
      .where('"userId" = :userId', { userId })
      .andWhere('"usedAt" IS NULL')
      .andWhere('"invalidatedAt" IS NULL')
      .execute();

    const rawToken = this.generateVerificationToken();
    const tokenHash = this.hashVerificationToken(rawToken);
    const expiresAt = new Date(Date.now() + this.verificationTokenTtlHours * 60 * 60 * 1000);

    await this.emailVerificationTokensRepository.save(
      this.emailVerificationTokensRepository.create({
        userId,
        tokenHash,
        expiresAt,
      }),
    );

    return rawToken;
  }

  async login(email: string, password: string) {
    // Buscar usuário no banco de dados
    const user = await this.usersRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error('Email ou senha inválidos');
    }

    // Validar senha
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new Error('Email ou senha inválidos');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email nao verificado. Verifique sua caixa de entrada.');
    }

    // Gerar JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      companyId: user.companyId,
    });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: user.companyId,
      },
    };
  }

  async register(email: string, password: string, name: string, phone?: string) {
    // Verificar se usuário já existe
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Criptografar senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.usersRepository.save(
      this.usersRepository.create({
        email,
        password: hashedPassword,
        name,
        ...(phone && { phone }),
        emailVerifiedAt: undefined,
        emailVerificationSentAt: new Date(),
      }),
    );

    const verificationToken = await this.createEmailVerificationToken(user.id);

    const frontendUrl = environmentConfig.frontendUrl.replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verificar-email/${verificationToken}`;

    try {
      await this.emailService.sendVerificationEmail(email, verificationUrl);
    } catch (error) {
      console.error('[EMAIL] Failed to send verification email:', error);
    }

    return {
      message: 'Conta criada. Verifique seu email para ativar o acesso.',
      verificationToken,
      verificationUrl,
    };
  }

  async resendVerification(email: string) {
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      throw new BadRequestException('Email é obrigatório');
    }

    const user = await this.usersRepository.findOne({ where: { email: normalizedEmail } });
    const genericMessage =
      'Se o email existir e ainda nao estiver verificado, enviaremos um novo link de verificacao.';

    if (!user || user.emailVerifiedAt) {
      return { message: genericMessage };
    }

    const verificationToken = await this.createEmailVerificationToken(user.id);
    const frontendUrl = environmentConfig.frontendUrl.replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verificar-email/${verificationToken}`;

    try {
      await this.emailService.sendVerificationEmail(user.email, verificationUrl);
      await this.usersRepository.update(user.id, { emailVerificationSentAt: new Date() });
    } catch (error) {
      console.error('[EMAIL] Failed to resend verification email:', error);
    }

    return {
      message: 'Novo link de verificacao enviado. Verifique sua caixa de entrada.',
      verificationToken,
      verificationUrl,
    };
  }

  async verifyEmail(token: string) {
    const normalizedToken = decodeURIComponent(token || '').trim();
    const tokenMatch = normalizedToken.match(/[0-9a-f]{32,128}/i);
    const verificationToken = tokenMatch?.[0] || normalizedToken;
    const tokenPreview = verificationToken
      ? `${verificationToken.slice(0, 8)}...${verificationToken.slice(-4)}`
      : 'empty';

    console.log('[AUTH][VERIFY_EMAIL] Request received', {
      rawLength: token?.length || 0,
      normalizedLength: verificationToken.length,
      hasTokenMatch: Boolean(tokenMatch),
      tokenPreview,
    });

    const tokenHash = this.hashVerificationToken(verificationToken);
    const tokenRecord = await this.emailVerificationTokensRepository.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (tokenRecord) {
      const user = tokenRecord.user;

      if (!user) {
        console.warn('[AUTH][VERIFY_EMAIL] Token record without user', { tokenPreview });
        throw new BadRequestException('Token de verificacao invalido');
      }

      if (user.emailVerifiedAt) {
        if (!tokenRecord.usedAt) {
          tokenRecord.usedAt = new Date();
          await this.emailVerificationTokensRepository.save(tokenRecord);
        }
        return { message: 'Email ja verificado' };
      }

      if (tokenRecord.invalidatedAt || tokenRecord.usedAt) {
        throw new BadRequestException('Token de verificacao invalido');
      }

      if (tokenRecord.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException('Token de verificacao expirado');
      }

      user.emailVerifiedAt = new Date();
      user.emailVerificationSentAt = null as any;
      tokenRecord.usedAt = new Date();

      await this.usersRepository.save(user);
      await this.emailVerificationTokensRepository.save(tokenRecord);

      console.log('[AUTH][VERIFY_EMAIL] Email verified successfully', {
        userId: user.id,
        email: user.email,
      });

      return { message: 'Email verificado com sucesso' };
    }

    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: verificationToken },
    });

    if (!user) {
      console.warn('[AUTH][VERIFY_EMAIL] Token not found', { tokenPreview });
      throw new BadRequestException('Token de verificacao invalido');
    }

    if (user.emailVerifiedAt) {
      console.log('[AUTH][VERIFY_EMAIL] Email already verified', {
        userId: user.id,
        email: user.email,
      });
      return { message: 'Email ja verificado' };
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationSentAt = null as any;
    await this.usersRepository.save(user);

    console.log('[AUTH][VERIFY_EMAIL] Email verified successfully', {
      userId: user.id,
      email: user.email,
    });

    return { message: 'Email verificado com sucesso' };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new Error('Token inválido');
    }
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['company'],
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Retornar sem a senha
    const { password, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Remover campos undefined para não sobrescrever dados existentes
    const updateData: any = {};
    
    Object.entries(updateProfileDto).forEach(([key, value]) => {
      // Só adicionar campos que têm valor
      if (value !== undefined && value !== '') {
        updateData[key] = value;
      }
      // Se for avatarUrl e tiver valor, sempre incluir (mesmo que esteja sendo alterado)
      if (key === 'avatarUrl' && value) {
        updateData[key] = value;
      }
    });

    console.log('Updating profile with data:', updateData); // Debug
    await this.usersRepository.update(userId, updateData);

    return this.getProfile(userId);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword, confirmPassword } = changePasswordDto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('As senhas não conferem');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('A senha deve ter no mínimo 8 caracteres');
    }

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual inválida');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersRepository.update(userId, {
      password: hashedPassword,
    });

    return { message: 'Senha alterada com sucesso' };
  }

  async updatePreferences(userId: string, updatePreferencesDto: UpdatePreferencesDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    await this.usersRepository.update(userId, updatePreferencesDto);

    return this.getProfile(userId);
  }

  async recordLogin(userId: string, ipAddress: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      return;
    }

    const loginHistory = user.loginHistory || [];
    loginHistory.push({
      date: new Date(),
      ip: ipAddress,
    });

    // Manter apenas últimos 50 logins
    if (loginHistory.length > 50) {
      loginHistory.shift();
    }

    await this.usersRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ipAddress,
      loginHistory,
    });
  }
}
