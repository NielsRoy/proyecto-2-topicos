import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { LLMService } from '../common/llm-service.interface';
import { LlmContentResponse } from '../interfaces/llm-content-response.interface';
import OpenAI from 'openai';
import { env } from '../../config/env.config';

@Injectable()
export class OpenAILLM implements LLMService {
  private openai: OpenAI;
  private readonly logger = new Logger(OpenAILLM.name);

  constructor() {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async generate(systemPrompt: string, userMessage: string): Promise<LlmContentResponse> {
    this.logger.log('Iniciando generación de contenido con OpenAI...');

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: userMessage 
          },
        ],
        response_format: { type: 'json_object' }, 
        //temperature: 0.7
      });

      const content = completion.choices[0].message.content;
      if (!content) {
        throw new Error('OpenAI respondió con contenido vacío.');
      }
      const parsedContent = JSON.parse(content) as LlmContentResponse;

      this.validateResponse(parsedContent);

      this.logger.log('Contenido generado y parseado exitosamente.');
      return parsedContent;
    } catch (error) {
      this.logger.error(`Error generando contenido: ${error.message}`, error.stack);
      
      if (error instanceof SyntaxError) {
        throw new InternalServerErrorException('La IA no generó un JSON válido.');
      }
      
      throw new InternalServerErrorException('Error al comunicarse con OpenAI provider.');
    }
  }

  private validateResponse(data: any): void {
    const requiredKeys = ['facebook', 'instagram', 'linkedin', 'whatsapp', 'tiktok', 'dalle_prompt', 'sora_prompt'];
    const missingKeys = requiredKeys.filter(key => !data[key]);

    if (missingKeys.length > 0) {
      const errorMessage = `La respuesta de la IA está incompleta. Faltan: ${missingKeys.join(', ')}`;
      this.logger.warn(errorMessage);
      throw new Error(errorMessage);
    }
  }
}