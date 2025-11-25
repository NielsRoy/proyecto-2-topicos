import { Module } from '@nestjs/common';
import { PromptService } from './services/prompt.service';
import { GeminiService } from './services/gemini.service';
import { LLM_SERVICE } from '../config/injection-tokens';
import { ImageGenerator } from './services/image-generator.service';
import { StorageModule } from '../storage/storage.module';
import { OpenAILLM } from './services/openai-llm.service';
import { VideoGenerator } from './services/video-generator.service';

@Module({
  providers: [
    PromptService,
    {
      provide: LLM_SERVICE,
      useClass: OpenAILLM,
    },
    ImageGenerator,
    VideoGenerator,
  ],
  imports: [StorageModule],
  exports: [PromptService, LLM_SERVICE, ImageGenerator, VideoGenerator],
})
export class LlmModule {}
