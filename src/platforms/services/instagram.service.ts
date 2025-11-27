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
  private readonly logger = new Logger('InstagramService');
  private readonly plogger = new Logger('Instagram');

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
    
    this.logger.log(`Iniciando flujo de publicación en Instagram: ${textContent.substring(0, 10)}...`);

    try {
      const container = await this.createContainer(containerData);
      
      this.logger.log(`Contenedor ${container.id} creado. Esperando validación...`);

      const status = await this.checkContainerStatus(container.id);
      if (status !== ContainerStatusCode.FINISHED) {
        return { success: false, platform: this.platformName, error: 'El contenedor no se acepto para publicación' };
      }      

      const publishData = { creation_id: container.id };
      const publishResponse = await this.publishContainer(publishData);
      const { permalink } = publishResponse;

      this.logger.log(`Flujo de publicación completado exitosamente`);

      return { success: true, platform: this.platformName, url: permalink };
    } catch (error) {
      this.logger.error(`Falló el flujo en Instagram: ${error.message}`);
      return { success: false, platform: this.platformName, error: error.message };
    }
  }

  private async createContainer(payload: CreateContainerRequest): Promise<CreateContainerResponse> {
    const url = `${this.baseUrl}/${this.accountId}/media`;
    try {
      this.plogger.log('API Request: Crear Contenedor', { method: 'POST', url, payload });
      const response = await this.httpService.axiosRef.post<CreateContainerResponse>(url, payload, this.config);
      this.plogger.log('API Response: Crear Contenedor', { statusCode: response.status, data: response.data });

      if (!response.data.id) throw new Error(`ID no recibido en la respuesta de creación`);
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.plogger.error('API Error: Crear Contenedor', {
        statusCode: axiosError.response?.status,
        apiError: axiosError.response?.data,
        message: axiosError.message
      });
      throw error;
    }
  }

  private async checkContainerStatus(containerId: string): Promise<ContainerStatusCode> {
    const url = `${this.baseUrl}/${containerId}`;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.plogger.log(`API Request: Check Status (Intento ${attempt})`, { method: 'GET', url });
        const response = await this.httpService.axiosRef.get<ContainerStatusResponse>(url, this.config);
        const { status_code } = response.data;
        this.plogger.log(`API Response: Check Status (Intento ${attempt})`, { statusCode: response.status, data: response.data });

        if (status_code === ContainerStatusCode.FINISHED || attempt === this.MAX_RETRIES) {
          return status_code;
        }
      } catch (error) {
        const axiosError = error as AxiosError;
        this.plogger.error('API Error: Check Status', {
          statusCode: axiosError.response?.status,
          apiError: axiosError.response?.data,
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
      this.plogger.log('API Request: Publicar Contenedor', { method: 'POST', url, payload });
      const response = await this.httpService.axiosRef.post<PublishContainerResponse>(url, payload, this.config);
      this.plogger.log('API Response: Publicar Contenedor', { statusCode: response.status, data: response.data });
      
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      this.plogger.error('API Error: Publicar Contenedor', {
        statusCode: axiosError.response?.status,
        apiError: axiosError.response?.data,
        message: axiosError.message
      });
      throw error;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}