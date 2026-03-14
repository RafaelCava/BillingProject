import { INestApplication, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Billing API')
    .setDescription('API da plataforma de gerenciamento de gastos')
    .setVersion('1.0.0')
    .addCookieAuth('access_token', { type: 'apiKey', in: 'cookie' }, 'access_token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Billing API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  Logger.debug(
    { module: 'Swagger', action: 'setupSwagger', phase: 'success', path: '/api/docs' },
    'Swagger',
  );
}