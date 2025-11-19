import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import { env } from 'src/config/env.config';

@Injectable()
export class PromptService implements OnModuleInit {
  private readonly logger = new Logger(PromptService.name);
  private template: string = '';
  private readonly PLACEHOLDER = '[MENSAJE_DEL_USUARIO]';

  onModuleInit() {
    this.loadTemplate();
  }

  private loadTemplate() {
    
    const filename = env.PROMPT_TEMPLATE_FILE;
    const filePath = path.join(process.cwd(), 'dist', 'prompts', filename);

    try {
      this.logger.log(`Cargando plantilla de prompt desde: ${filename}`);
      this.template = fs.readFileSync(filePath, 'utf-8');
      if (!this.template.includes(this.PLACEHOLDER)) {
        this.logger.warn(`La plantilla cargada no contiene el placeholder: ${this.PLACEHOLDER}`);
      }
    } catch (error) {
      this.logger.error(`Error fatal cargando la plantilla: ${filePath}`, error.stack);
      throw new Error('No se pudo cargar la plantilla de prompt inicial.');
    }
  }

  generate(message: string): string {
    if (!this.template) {
        throw new Error('La plantilla de prompt no está cargada.');
    }
    return this.template.replace(this.PLACEHOLDER, message);
  } 
}