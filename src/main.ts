import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env.config';
import { Logger, ValidationPipe } from '@nestjs/common';
import { loggerConfig } from './config/logger.config';

const logger = new Logger('main');

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(env.PORT);

  logger.log(`App running on port: ${env.PORT}`);
}
bootstrap();
