import { Injectable, Logger } from '@nestjs/common';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../common/publis-result.interface';
import { env } from 'src/config/env.config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { CreateContainerRequest, CreateContainerResponse } from '../interfaces/instagram.types';

@Injectable()
export class InstagramService implements SocialMediaPublisher {
  readonly platformName = 'instagram';
  private readonly logger = new Logger(InstagramService.name); // O tu JsonLogger
  private readonly baseUrl = "https://graph.instagram.com/v24.0";
  private readonly accountId = env.INSTAGRAM_ACCOUNT_ID;
  private readonly accessToken = env.INSTAGRAM_ACCOUNT_ACCESS_TOKEN;

  private readonly requestConfig: AxiosRequestConfig = {
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_MS = 3000;

  constructor(private readonly httpService: HttpService) {}

  async publish(content: string): Promise<PublishResult> {
    const containerData = {
      caption: content,
      image_url: "https://img.freepik.com/foto-gratis/primer-plano-guacamayo-escarlata-lado-primer-plano-cabeza-guacamayo-scarlata_488145-3540.jpg"
    };
    this.logger.log(`Iniciando flujo de publicación en Instagram`, {
      action: 'start_publish',
      contentSnippet: content.substring(0, 30)
    });
    try {
      const container = await this.createContainer(containerData);
      
      this.logger.log(`Contenedor creado, iniciando espera de validación...`, {
        action: 'wait_validation',
        containerId: container.id
      });
      const publishResponse = await this.publishContainer(container.id);
      this.logger.log(`Flujo de publicación completado exitosamente`, {
        action: 'publish_success',
        finalId: publishResponse.id,
        platform: this.platformName
      });

      return { success: true, platform: this.platformName, url: `https://instagram.com/p/${publishResponse.id}` };
    } catch (error) {
      this.logger.error('Falló el flujo de publicación en Instagram', {
        action: 'publish_failed',
        error: error.message,
        stack: error.stack
      });
      return { success: false, platform: this.platformName, error: error.message };
    }
  }

  private async createContainer(payload: CreateContainerRequest): Promise<CreateContainerResponse> {
    const url = `${this.baseUrl}/${this.accountId}/media`;
    try {
      const response = await this.httpService.axiosRef.post(url, payload, this.requestConfig);

      this.logger.log('Respuesta Instagram: Crear Contenedor', {
        action: 'instagram_response_create_container',
        statusCode: response.status,
        responseData: response.data,
      });

      const containerId = response.data.id; 
      if (!containerId) throw new Error(`ID no recibido en la respuesta de creación`);

      return { id: containerId };
    } catch (error) {
      const axiosError = error as AxiosError;
      
      this.logger.error('Error Instagram: Crear Contenedor', {
        action: 'instagram_error_create_container',
        statusCode: axiosError.response?.status,
        apiErrorData: axiosError.response?.data,
        message: axiosError.message
      });
      throw error;
    }
  }

  private async publishContainer(containerId: string): Promise<any> {
    const url = `${this.baseUrl}/${this.accountId}/media_publish`;
    const publishData = { creation_id: containerId };

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.httpService.axiosRef.post(url, publishData, this.requestConfig);

        this.logger.log(`Contenedor de Instagram publicado en intento ${attempt}`, {
          state: 'success',
          attempt,
          containerId,
          responseData: response.data
        });

        return response.data;
      } catch (error) {
        //const status = error.response?.status;
        const apiError = error.response?.data?.error;

        this.logger.warn(`Intento ${attempt}/${this.MAX_RETRIES} fallido`, {
          state: 'retry_waiting',
          attempt,
          containerId,
          reason: apiError?.message || error.message
        });
        if (attempt === this.MAX_RETRIES) {
          this.logger.error('Se agotaron los intentos', {
            state: 'failed_final',
            containerId,
            lastError: apiError
          });
          throw new Error(`No se pudo publicar el contenedor después de ${this.MAX_RETRIES} intentos`); // [cite: 32]
        }
        await this.sleep(this.RETRY_DELAY_MS);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}