import { Injectable, Logger } from '@nestjs/common';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../common/publis-result.interface';
import { env } from '../../config/env.config';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { HttpService } from '@nestjs/axios';
import { LinkedInResponse } from '../interfaces/linkedin-response.interface';

@Injectable()
export class LinkedInService implements SocialMediaPublisher {
  readonly platformName = 'linkedin';
  private readonly logger = new Logger(LinkedInService.name); // O tu JsonLogger
  private readonly baseUrl = "https://api.linkedin.com/v2";
  private readonly profileId = env.LINKEDIN_PROFILE_ID;
  private readonly accessToken = env.LINKEDIN_PROFILE_ACCESS_TOKEN;

  constructor(private readonly httpService: HttpService) {}

  async publish(content: string): Promise<PublishResult> {
    const postUrl = `${this.baseUrl}/ugcPosts`;
    const data = {
      author: `urn:li:person:${this.profileId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content
          },
          shareMediaCategory: "NONE"
        }
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
      }
    };
    const config: AxiosRequestConfig = {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };
    this.logger.log(`Publicando en LinkedIn: ${content.substring(0, 20)}...`);
    try {
      const response = await this.httpService.axiosRef.post(postUrl, data, config);
      
      this.logger.log('Respuesta exitosa de LinkedIn', {
        platform: this.platformName,
        state: 'success',
        statusCode: response.status,
        responseData: response.data,
      });

      return { success: true, platform: this.platformName, url: "" };
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error('Fallo al publicar en LinkedIn', {
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