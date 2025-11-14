import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from './config/env';
import { Logger } from '@nestjs/common';

const logger = new Logger('main');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(env.PORT);

  logger.log(`App running on port: ${env.PORT}`);
}
bootstrap();
