import { Injectable, Logger } from '@nestjs/common';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../common/publis-result.interface';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { FacebookResponse } from '../interfaces/facebook-response.interface';
import { env } from 'src/config/env.config';

@Injectable()
export class FacebookService implements SocialMediaPublisher {
  readonly platformName = 'facebook';
  private readonly logger = new Logger(FacebookService.name);
  private readonly baseUrl = "https://graph.facebook.com/v24.0";
  private readonly pageId = env.FACEBOOK_PAGE_ID;
  private readonly accessToken = env.FACEBOOK_PAGE_ACCESS_TOKEN;

  constructor(private readonly httpService: HttpService) {}

  async publish(content: string): Promise<PublishResult> {
    const postUrl = `${this.baseUrl}/${this.pageId}/feed?fields=id,permalink_url`;
    const data = { message: content };
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    this.logger.log(`Publicando en Facebook: ${content.substring(0, 20)}...`);
    try {
      const response = await this.httpService.axiosRef.post(postUrl, data, config);
      const fbResponse: FacebookResponse = response.data;
      
      this.logger.log('Respuesta exitosa de Facebook', {
        platform: this.platformName,
        state: 'success',
        statusCode: response.status,
        responseData: response.data,
      });

      return { success: true, platform: this.platformName, url: fbResponse.permalink_url };
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