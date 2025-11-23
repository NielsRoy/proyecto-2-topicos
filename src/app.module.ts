import { Module } from '@nestjs/common';
import { PlatformsModule } from './platforms/platforms.module';
import { PublishingModule } from './publishing/publishing.module';
import { LlmModule } from './llm/llm.module';
import { UsersModule } from './users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { env } from './config/env.config';

@Module({
  imports: [
    PlatformsModule,
    PublishingModule,
    LlmModule,
    UsersModule,
    TypeOrmModule.forRoot({
      ssl: env.STATE === 'production',
      extra: {
        ssl: env.STATE === 'production'
        ? { rejectUnauthorized: false }
        : false
      },
      type: 'postgres',
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      synchronize: true,
      autoLoadEntities: true,
    }),
  ],
})
export class AppModule {}
