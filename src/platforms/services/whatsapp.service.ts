import { Injectable, Logger } from '@nestjs/common';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../interfaces/publish-result.interface';
import { PublicationData } from '../interfaces/publication-data.interface';
import { HttpService } from '@nestjs/axios';
import { env } from '../../config/env.config';
import { AxiosError } from 'axios';

@Injectable()
export class WhatsappService implements SocialMediaPublisher {
  readonly platformName = 'whatsapp';
  private readonly logger = new Logger('WhatsappService');
  private readonly plogger = new Logger('Whatsapp');

  private readonly baseUrl = 'https://gate.whapi.cloud'; 
  private readonly apiToken = env.WHATSAPP_API_TOKEN;

  constructor(private readonly httpService: HttpService) {}

  async publish(data: PublicationData): Promise<PublishResult> {
    const url = `${this.baseUrl}/stories/send/media`;
    const { textContent, fileUrl: publicUrl } = data;
    
    if (!publicUrl){
      return {
        success: false, platform: this.platformName, error: 'La url de imagen es obligatoria.'
      };
    }
    
    this.logger.log(`Iniciando publicación de historia en WhatsApp...`);

    try {
      const payload = {
        media: publicUrl,
        caption: textContent,
        contacts: [],
        exclude_contacts: []
      }

      const config = {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`,
        },
      };
      this.plogger.log('API Request: Send Story', { method: 'POST', url, payload });
      const response = await this.httpService.axiosRef.post(url, payload, config);

      this.plogger.log('API Response: Send Story', { statusCode: response.status, data: response.data });
      this.logger.log('Historia publicada exitosamente en WhatsApp');

      return { success: true, platform: this.platformName };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.plogger.error('API Error: Send Story', {
        statusCode: axiosError.response?.status,
        apiError: axiosError.response?.data,
        message: axiosError.message
      });
      return { success: false, platform: this.platformName, error: error.message };
    }
  }
}