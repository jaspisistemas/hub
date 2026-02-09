import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { 
    cors: {
      origin: (origin, callback) => {
        // Aceitar localhost, cloudflare tunnels, ngrok, e sem origin (mobile/desktop)
        const allowedOrigins = [
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5174',
          'https://panel-joshua-norfolk-molecular.trycloudflare.com',
        ];

        const allowedPatterns = [
          /localhost:\d+/,
          /ngrok.*\.dev$/,
          /trycloudflare\.com$/,
        ];
        
        // Sem origin (mobile apps, etc) → aceitar
        if (!origin) {
          callback(null, true);
          return;
        }

        // Verificar se está na lista permitida
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        // Verificar padrões
        if (allowedPatterns.some(pattern => pattern.test(origin))) {
          callback(null, true);
          return;
        }

        console.warn(`❌ CORS: Origin bloqueado: ${origin}`);
        callback(new Error(`CORS não permitido para: ${origin}`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
    }
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
