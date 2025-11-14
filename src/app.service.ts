import { GoogleGenAI } from '@google/genai';
import { Injectable } from '@nestjs/common';
import { env } from './config/env';
import { PromptService } from './prompt.service';
import { EventDto } from './dto/event.dto';
import { AiResponse } from './dto/ai-response.dto';

@Injectable()
export class AppService {

  // The client gets the API key from the environment variable `GEMINI_API_KEY`.
  private readonly ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
  });

  constructor(
    private readonly promptService: PromptService
  ) {}

  async sendRequestToAI(eventDto: EventDto) {
    const prompt = this.promptService.generatePrompt(eventDto);

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    console.log(response.text);
    return response;
  }
}
