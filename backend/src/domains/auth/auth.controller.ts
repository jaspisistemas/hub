import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

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
}
