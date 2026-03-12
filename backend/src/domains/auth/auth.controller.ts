import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param,
  HttpException, 
  HttpStatus,
  UseGuards,
  Request,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { createImageUploadConfig } from '../../config/upload.config';
import { buildUploadUrl } from '../../utils/file.helpers';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const result = await this.authService.login(body.email, body.password);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao fazer login';
      throw new HttpException(
        message,
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('register')
  async register(
    @Body() body: { email: string; password: string; name: string; phone?: string },
  ) {
    try {
      const result = await this.authService.register(
        body.email,
        body.password,
        body.name,
        body.phone,
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao registrar';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    try {
      return await this.authService.resendVerification(body.email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao reenviar verificacao';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('verify-email/:token')
  async verifyEmail(@Param('token') token: string) {
    try {
      return await this.authService.verifyEmail(token);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao verificar email';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('validate')
  async validate(@Body() body: { token: string }) {
    try {
      const decoded = await this.authService.validateToken(body.token);
      return { valid: true, data: decoded };
    } catch (error) {
      throw new HttpException(
        'Token inválido',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    try {
      const profile = await this.authService.getProfile(req.user.id);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar perfil';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar', createImageUploadConfig('avatars', true)))
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto?: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    try {
      let profileData: Partial<UpdateProfileDto> = {};
      
      // Se houver arquivo (FormData), extrair dados do req.body
      // Se não houver, usar o DTO normal
      if (file) {
        // Quando vem com arquivo, multer coloca os campos em req.body
        profileData = {
          ...req.body,
          avatarUrl: buildUploadUrl('AVATARS', file.filename),
        };
        console.log('Updating with file, avatar URL:', profileData.avatarUrl); // Debug
      } else {
        // Quando é JSON puro
        profileData = updateProfileDto || {};
        console.log('Updating without file, data:', profileData); // Debug
      }
      
      const profile = await this.authService.updateProfile(req.user.id, profileData as UpdateProfileDto);
      console.log('Profile updated successfully, returning:', profile); // Debug
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar perfil';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Request() req: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      const result = await this.authService.changePassword(req.user.id, changePasswordDto);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao alterar senha';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Put('preferences')
  @UseGuards(JwtAuthGuard)
  async updatePreferences(
    @Request() req: any,
    @Body() updatePreferencesDto: UpdatePreferencesDto,
  ) {
    try {
      const profile = await this.authService.updatePreferences(req.user.id, updatePreferencesDto);
      return profile;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar preferências';
      throw new HttpException(
        message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
