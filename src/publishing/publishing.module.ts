import { Module } from '@nestjs/common';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';
import { LlmModule } from 'src/llm/llm.module';
import { PlatformsModule } from 'src/platforms/platforms.module';

@Module({
  imports: [
    LlmModule,
    PlatformsModule
  ],
  controllers: [PublishingController],
  providers: [PublishingService],
})
export class PublishingModule {}
