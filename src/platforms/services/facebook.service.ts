import { Injectable, Logger } from '@nestjs/common';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../interfaces/publish-result.interface';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { FacebookResponse } from '../interfaces/facebook.types';
import { env } from '../../config/env.config';
import { PublicationData } from '../interfaces/publication-data.interface';

@Injectable()
export class FacebookService implements SocialMediaPublisher {
  readonly platformName = 'facebook';
  private readonly logger = new Logger(FacebookService.name);

  private readonly pageId = env.FACEBOOK_PAGE_ID;
  private readonly accessToken = env.FACEBOOK_PAGE_ACCESS_TOKEN;
  private readonly baseUrl = `https://graph.facebook.com/v24.0/${this.pageId}`;
  private readonly baseLink = `https://www.facebook.com`;

  private readonly config: AxiosRequestConfig = {
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  constructor(private readonly httpService: HttpService) {}

  async publish(data: PublicationData): Promise<PublishResult> {
    const { textContent, publicUrl } = data;
    const isPhotoPost = !!publicUrl;
    const endpoint = isPhotoPost ? 'photos' : 'feed';
    const url = `${this.baseUrl}/${endpoint}`;
    const payload: any = { message: textContent };
    if (isPhotoPost) {
      payload.url = publicUrl;
    }

    this.logger.log(`Publicando en Facebook (${endpoint}): ${textContent.substring(0, 10)}...`);

    try {
      const response = await this.httpService.axiosRef.post<FacebookResponse>(url, payload, this.config);

      this.logger.log('Respuesta exitosa de Facebook', {
        platform: this.platformName,
        state: 'success',
        statusCode: response.status,
        responseData: response.data,
      });

      const post = response.data.post_id ?? response.data.id;
      const link = `${this.baseLink}/${post}`;
      return { success: true, platform: this.platformName, url: link };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error('Fallo al publicar en Facebook', {
        platform: this.platformName,
        state: 'error',
        statusCode: axiosError.response?.status,
        errorMessage: axiosError.message,
        responseData: axiosError.response?.data,
        stack: error.stack
      });
      return { success: false, platform: this.platformName, error: error.message };
    }
  }
}