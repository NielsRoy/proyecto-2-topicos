import { Injectable, Logger } from '@nestjs/common';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../interfaces/publish-result.interface';
import { env } from '../../config/env.config';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { ContainerStatusCode, ContainerStatusResponse, CreateContainerRequest, CreateContainerResponse, PublishContainerRequest, PublishContainerResponse } from '../interfaces/instagram.types';
import { PublicationData } from '../interfaces/publication-data.interface';

@Injectable()
export class InstagramService implements SocialMediaPublisher {
  readonly platformName = 'instagram';
  private readonly logger = new Logger(InstagramService.name); // O tu JsonLogger
  private readonly accountId = env.INSTAGRAM_ACCOUNT_ID;
  private readonly accessToken = env.INSTAGRAM_ACCOUNT_ACCESS_TOKEN;
  private readonly baseUrl = `https://graph.instagram.com/v24.0`;

  private readonly config: AxiosRequestConfig = {
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  private readonly MAX_RETRIES = 5;
  private readonly RETRY_DELAY_MS = 3000;

  constructor(private readonly httpService: HttpService) {}

  async publish(data: PublicationData): Promise<PublishResult> {
    const { textContent, fileUrl: publicUrl } = data;
    if (!publicUrl){
      return {
        success: false, platform: this.platformName, error: 'La url de imagen es obligatoria.'
      };
    }
    const containerData = {
      caption: textContent,
      image_url: publicUrl,
    };
    this.logger.log(`Iniciando flujo de publicación en Instagram`, {
      action: 'start_publish',
      contentSnippet: textContent.substring(0, 30)
    });
    try {
      const container = await this.createContainer(containerData);
      
      this.logger.log(`Contenedor creado, iniciando espera de validación...`, {
        action: 'wait_validation',
        containerId: container.id
      });

      const status = await this.checkContainerStatus(container.id);
      if (status !== ContainerStatusCode.FINISHED) {
        return { success: false, platform: this.platformName, error: 'El contenedor no se acepto para publicación' };
      }      

      const publishData = { creation_id: container.id };
      const publishResponse = await this.publishContainer(publishData);
      const { permalink } = publishResponse;

      this.logger.log(`Flujo de publicación completado exitosamente`, {
        action: 'publish_success',
        finalId: publishResponse.id,
        platform: this.platformName
      });

      return { success: true, platform: this.platformName, url: permalink };
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
      const response = await this.httpService.axiosRef.post<CreateContainerResponse>(url, payload, this.config);
      this.logger.log('Respuesta Instagram: Crear Contenedor', {
        action: 'instagram_response_create_container',
        statusCode: response.status,
        responseData: response.data,
      });
      if (!response.data.id) throw new Error(`ID no recibido en la respuesta de creación`);
      return response.data;
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

  private async checkContainerStatus(containerId: string): Promise<ContainerStatusCode> {
    const url = `${this.baseUrl}/${containerId}`;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.httpService.axiosRef.get<ContainerStatusResponse>(url, this.config);
        const { status_code } = response.data;

        this.logger.log(`Respuesta Instagram: Revisar Contenedor, intento ${attempt}`, {
          action: 'instagram_response_check_container',
          statusCode: response.status,
          responseData: response.data,
        });

        if (status_code === ContainerStatusCode.FINISHED || attempt === this.MAX_RETRIES) {
          return status_code;
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        this.logger.error('Error Instagram: Revisar Contenedor', {
          action: 'instagram_error_check_container',
          statusCode: axiosError.response?.status,
          apiErrorData: axiosError.response?.data,
          message: axiosError.message
        });
        throw error;
      }
      await this.sleep(this.RETRY_DELAY_MS);
    }
    return ContainerStatusCode.ERROR;
  }

  private async publishContainer(payload: PublishContainerRequest): Promise<PublishContainerResponse> {
    const url = `${this.baseUrl}/${this.accountId}/media_publish?fields=permalink`;
    try {
      const response = await this.httpService.axiosRef.post<PublishContainerResponse>(url, payload, this.config);
      
      this.logger.log('Respuesta Instagram: Publicar Contenedor', {
        action: 'instagram_response_publish_container',
        statusCode: response.status,
        responseData: response.data,
      });
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error('Error Instagram: Publicar Contenedor', {
        action: 'instagram_error_publish_container',
        statusCode: axiosError.response?.status,
        apiErrorData: axiosError.response?.data,
        message: axiosError.message
      });
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}