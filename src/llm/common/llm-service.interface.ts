import { LlmContentResponse } from './llm-content-response.interface';

export interface LlmService {
  generateContent(prompt: string): Promise<LlmContentResponse>;
}