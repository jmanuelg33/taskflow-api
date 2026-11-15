import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('TaskFlow API')
    .setDescription('REST API for task management')
    .setVersion('1.0')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(
      app as unknown as Parameters<typeof SwaggerModule.createDocument>[0],
      swaggerConfig,
    );

  SwaggerModule.setup(
    'api/v1/docs',
    app as unknown as Parameters<typeof SwaggerModule.setup>[1],
    documentFactory,
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
