import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { environmentConfig } from './config/environment.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://localhost:5173',
        'https://localhost:5173',
        'http://127.0.0.1:5173',
        'https://127.0.0.1:5173',
        'https://portsmouth-tin-import-favour.trycloudflare.com',
        'https://uneducated-georgiann-personifiant.ngrok-free.dev',
        /^https:\/\/(.*\.)?trycloudflare\.com$/, // Permitir qualquer subdomínio Cloudflare
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning', 'Accept', 'X-Requested-With'],
      exposedHeaders: ['Content-Range', 'X-Content-Range'],
      maxAge: 86400,
    },
  });
  
  // Servir arquivos estáticos da pasta uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Habilitar validação global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));
  
  app.enableShutdownHooks();
  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();
