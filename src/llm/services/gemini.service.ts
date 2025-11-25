import { Injectable, Logger } from "@nestjs/common";
import { LlmContentResponse } from "../interfaces/llm-content-response.interface";
import { env } from "../../config/env.config";
import { GoogleGenAI } from "@google/genai";
import { LLMService } from "../common/llm-service.interface";

@Injectable()
export class GeminiService implements LLMService {
  
  private readonly logger = new Logger(GeminiService.name);

  private readonly ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY
  });

  async generate(systemPrompt: string, userMessage: string): Promise<LlmContentResponse> {
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemPrompt
      });
      const jsonString = response.text;
      this.logger.log(`Respuesta JSON (string) recibida del LLM: ${jsonString}`);

      const parsedResponse: LlmContentResponse = JSON.parse(jsonString ?? '');
      return parsedResponse;
    } catch (error) {
      this.logger.error("Error al generar o parsear contenido de Gemini", error.stack);
      throw new Error("No se pudo obtener una respuesta JSON válida del LLM.");
    }
  }
}