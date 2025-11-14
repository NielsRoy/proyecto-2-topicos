import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PromptService } from './prompt.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, PromptService],
})
export class AppModule {}
