import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { environmentConfig } from '../../config/environment.config';
import { User } from './entities/user.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { EmailService } from '../../infra/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

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

    const verificationToken = uuid();

    await this.usersRepository.save(
      this.usersRepository.create({
        email,
        password: hashedPassword,
        name,
        ...(phone && { phone }),
        emailVerifiedAt: null,
        emailVerificationToken: verificationToken,
        emailVerificationSentAt: new Date(),
      }),
    );

    const frontendUrl = environmentConfig.frontendUrl.replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verificar-email/${verificationToken}`;

    try {
      await this.emailService.sendVerificationEmail(email, verificationUrl);
    } catch (error) {
      console.error('[EMAIL] Failed to send verification email:', error);
    }

    return {
      message: 'Conta criada. Verifique seu email para ativar o acesso.',
      verificationUrl,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOne({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de verificacao invalido');
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email ja verificado' };
    }

    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null as any;
    user.emailVerificationSentAt = null as any;
    await this.usersRepository.save(user);

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
