import { LlmContentResponse } from '../interfaces/llm-content-response.interface';

export interface LLMService {
  generate(systemPrompt: string, userMessage: string): Promise<LlmContentResponse>;
}