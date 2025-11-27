import { Inject, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { env } from '../../config/env.config';
import { ResourceType } from '../../storage/enum/resource-type.enum';
import { randomBytes } from 'crypto';
import { FileAI } from '../interfaces/file-ai.interface';
import { STORAGE_SERVICE } from '../../config/injection-tokens';
import type { StorageService } from '../../storage/common/file-storage.interface';

@Injectable()
export class ImageGenerator {
  
  private openai: OpenAI;
  private readonly logger = new Logger(ImageGenerator.name);

  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async generate(prompt: string): Promise<FileAI> {
    try {
      const response = await this.openai.images.generate({
        model: 'gpt-image-1',
        prompt: prompt,
        n: 1, // DALL-E 3 solo permite generar 1 imagen por request
        size: '1024x1024',
      });
      // this.logger.log(response);
      if (!response.data || response.data.length === 0) {
        throw new InternalServerErrorException('La API de OpenAI no retornó ninguna imagen.');
      }
      const base64Data = response.data[0].b64_json;
      if (!base64Data) {
        throw new InternalServerErrorException('La imagen retornada no contiene datos en Base64.');
      }
      const imageAI = await this.save(base64Data);
      
      this.logger.log(`Imagen publicada en: ${imageAI.publicUrl}`);
      
      return imageAI;
    } catch (error) {
      this.logger.error('Error generando imagen:', error);
      throw new InternalServerErrorException('Error al generar la imagen con OpenAI');
    }
  }

  private async save(base64Data: string): Promise<FileAI> {
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueId = randomBytes(8).toString('hex'); 
    const fileName = `img-${uniqueId}.png`;

    const publicUrl = await this.storageService.save(buffer, fileName, ResourceType.image);
    //const filepath = await this.localStorageService.save(buffer, fileName, ResourceType.image);
    return { publicUrl };
  }
}