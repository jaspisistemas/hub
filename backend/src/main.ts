import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { environmentConfig } from './config/environment.config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: {
      origin: environmentConfig.corsOrigins,
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
  
  const portRaw = process.env.PORT;
  const port = portRaw ? parseInt(portRaw, 10) : NaN;
  if (Number.isNaN(port)) {
    throw new Error('[ENV] PORT is required');
  }

  app.enableShutdownHooks();
  await app.listen(port);
  console.log(`Backend running on ${environmentConfig.backendUrl}`);
}
bootstrap();
