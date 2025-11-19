import { Module } from '@nestjs/common';
import { PlatformsModule } from './platforms/platforms.module';
import { PublishingModule } from './publishing/publishing.module';
import { LlmModule } from './llm/llm.module';

@Module({
  imports: [
    PlatformsModule,
    PublishingModule,
    LlmModule,
  ],
})
export class AppModule {}
