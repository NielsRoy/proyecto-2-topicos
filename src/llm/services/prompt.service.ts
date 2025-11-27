import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { env } from '../../config/env.config';

@Injectable()
export class PromptService implements OnModuleInit {
  private readonly logger = new Logger(PromptService.name);
  private prompt: string = '';

  onModuleInit() {
    const filename = 'prompt-v1.0.0.txt';
    const filepath = path.join(process.cwd(), 'dist', 'prompts', filename);
    this.prompt = this.loadTemplate(filepath);
  }

  private loadTemplate(filepath: string): string {
    try {
      this.logger.log(`Cargando prompt maestro desde: ${filepath}`);
      const template = fs.readFileSync(filepath, 'utf-8');
      return template;
    } catch (error) {
      this.logger.error(`Error fatal cargando el prompt maestro: ${filepath}`, error.stack);
      throw new Error('No se pudo cargar el prompt maestro.');
    }
  }

  generate(): string {
    if (!this.prompt) {
      throw new Error('El prompt maestro para generar recursos no está cargado.');
    }
    return this.prompt;
  }
}