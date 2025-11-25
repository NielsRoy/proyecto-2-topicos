import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { env } from '../../config/env.config';
import { randomBytes } from 'crypto';
import { ResourceType } from '../../storage/enum/resource-type.enum';
import { LocalStorageService } from '../../storage/services/local-storage.service';
import { CloudinaryStorageService } from '../../storage/services/cloudinary-storage.service';
import { FileAI } from '../interfaces/file-ai.interface';

@Injectable()
export class VideoGenerator {
  private openai: OpenAI;
  private readonly logger = new Logger(VideoGenerator.name);
  
  private readonly POLL_DELAY_MS = 3000;

  constructor(
    private readonly localStorageService: LocalStorageService,
    private readonly cloudinaryStorageService: CloudinaryStorageService,
  ) {
    this.openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
    });
  }

  async generate(prompt: string): Promise<FileAI> {
    try {
      this.logger.log(`Iniciando generación de video para: "${prompt.substring(0, 10)}..."`);

      let video = await this.openai.videos.create({
        model: 'sora-2',
        prompt: prompt,
        size: '720x1280',
        seconds: '4',
      });

      let progress = video.progress ?? 0;
      while (video.status === 'in_progress' || video.status === 'queued') {
        video = await this.openai.videos.retrieve(video.id);
        progress = video.progress ?? 0;
        this.logger.log(
          `${video.status === 'queued' ? 'En cola' : 'Procesando'}: ${progress.toFixed(1)}%`,
        );
        await this.sleep(this.POLL_DELAY_MS);
      }
      if (video.status === 'failed') {
        throw new Error(
          video.error?.message || 'Error desconocido al generar video',
        );
      }
      this.logger.log('Video completado, descargando...');
      const content = await this.openai.videos.downloadContent(video.id);
      const buffer = Buffer.from(await content.arrayBuffer());
      const videoAI = await this.save(buffer);
      return videoAI;
    } catch (error) {
      this.logger.error('Error generando el video con OpenAI', error);
      throw new InternalServerErrorException(
        'Falló la generación del video: ' + error.message,
      );
    }
  }

  private async save(buffer: Buffer): Promise<FileAI> {
    const uniqueId = randomBytes(8).toString('hex'); 
    const fileName = `vid-${uniqueId}.mp4`;

    const publicUrl = await this.cloudinaryStorageService.save(buffer, fileName, ResourceType.video);
    const filepath = this.localStorageService.save(buffer, fileName, ResourceType.video);
    return { filepath, publicUrl };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
