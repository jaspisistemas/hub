import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  // Configurar CORS dinamicamente baseado em variáveis de ambiente
  const allowedOrigins = [
    'https://panel-joshua-norfolk-molecular.trycloudflare.com',
    'https://robin-cup-translate-indicated.trycloudflare.com',
    'https://uneducated-georgiann-personifiant.ngrok-free.dev',
    'https://localhost:3000',
    'http://localhost:3000',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://localhost:5174',
    'https://localhost:5174',
  ];

  // Adicionar origem do ngrok se configurada
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  
  // Adicionar BACKEND_URL do .env para aceitar requisições dele também
  if (process.env.BACKEND_URL) {
    const backendOrigin = process.env.BACKEND_URL.replace(/\/$/, ''); // Remove trailing slash
    if (!allowedOrigins.includes(backendOrigin)) {
      allowedOrigins.push(backendOrigin);
    }
  }

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: true,
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
