import { Module } from '@nestjs/common';
import { PromptService } from './services/prompt.service';
import { GeminiService } from './services/gemini.service';
import { LLM_SERVICE } from 'src/config/injection-tokens';

@Module({
  providers: [
    PromptService,
    {
      provide: LLM_SERVICE,
      useClass: GeminiService,
    },
  ],
  exports: [PromptService, LLM_SERVICE],
})
export class LlmModule {}
