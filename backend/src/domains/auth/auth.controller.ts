import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  HttpException, 
  HttpStatus,
  UseGuards,
  Request,
  Req
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';

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
    @Body() body: { email: string; password: string; name: string },
  ) {
    try {
      const result = await this.authService.register(
        body.email,
        body.password,
        body.name,
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
      const profile = await this.authService.getProfile(req.user.sub);
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
  async updateProfile(
    @Request() req: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    try {
      const profile = await this.authService.updateProfile(req.user.sub, updateProfileDto);
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
      const result = await this.authService.changePassword(req.user.sub, changePasswordDto);
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
      const profile = await this.authService.updatePreferences(req.user.sub, updatePreferencesDto);
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
