/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { setupSwagger } from './app/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  Logger.debug({ module: 'Bootstrap', action: 'bootstrap', phase: 'start' }, 'Bootstrap');
  const allowedOrigins = (process.env.FRONTEND_URLS || 'http://localhost:8080,http://localhost:3000,http://localhost:3001')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  Logger.debug({ module: 'Bootstrap', action: 'corsConfig', phase: 'configured', allowedOrigins }, 'Bootstrap');

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        Logger.debug(
          { module: 'Bootstrap', action: 'cors', phase: 'allowed', origin: origin ?? 'same-origin' },
          'Bootstrap',
        );
        callback(null, true);
        return;
      }

      Logger.warn({ module: 'Bootstrap', action: 'cors', phase: 'blocked', origin }, 'Bootstrap');
      callback(new Error('Origin não permitida pelo CORS.'));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  Logger.debug({ module: 'Bootstrap', action: 'validationPipe', phase: 'configured' }, 'Bootstrap');

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  setupSwagger(app);
  const port = process.env.PORT || 3000;
  Logger.debug({ module: 'Bootstrap', action: 'bootstrap', phase: 'configured', port, globalPrefix }, 'Bootstrap');
  await app.listen(port);
  Logger.debug({ module: 'Bootstrap', action: 'bootstrap', phase: 'success', port, globalPrefix }, 'Bootstrap');
}

bootstrap();
