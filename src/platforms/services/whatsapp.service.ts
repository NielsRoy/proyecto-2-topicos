import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../common/publis-result.interface';
import { env } from '../../config/env.config';

@Injectable()
export class WhatsappService implements SocialMediaPublisher {
  readonly platformName = 'whatsapp';
  private readonly logger = new Logger(WhatsappService.name);

  // Credenciales de Twilio
  private readonly accountSid = env.TWILIO_ACCOUNT_SID;
  private readonly authToken = env.TWILIO_AUTH_TOKEN;
  
  // Números (Twilio requiere el prefijo 'whatsapp:' para enviar mensajes de WA)
  private readonly fromNumber = `whatsapp:${env.TWILIO_PHONE_NUMBER}`; 
  // El número estático al que enviarás el mensaje (ej: +591...)
  //private readonly targetNumber = `whatsapp:${env.WHATSAPP_TO_NUMBER}`; 
  private readonly targetNumber = `whatsapp:+59172474541`;

  constructor(private readonly httpService: HttpService) {}

  async publish(content: string): Promise<PublishResult> {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
    this.logger.log(this.accountSid);
    this.logger.log(this.authToken);
    this.logger.log(this.fromNumber);
    
    // Twilio requiere x-www-form-urlencoded, NO application/json
    const data = new URLSearchParams();
    data.append('To', this.targetNumber);
    data.append('From', this.fromNumber);
    data.append('Body', content);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // Twilio usa Basic Auth (SID es usuario, Token es password)
      auth: {
        username: this.accountSid,
        password: this.authToken,
      },
    };

    this.logger.log(`Enviando mensaje Twilio/Whatsapp a ${this.targetNumber}: ${content.substring(0, 20)}...`);

    try {
      const response = await this.httpService.axiosRef.post(url, data, config);
      
      this.logger.log('Respuesta exitosa de Twilio', {
        platform: this.platformName,
        state: 'success',
        statusCode: response.status,
        // Twilio devuelve detalles del mensaje como SID, status, etc.
        responseData: response.data, 
      });

      return { 
        success: true, 
        platform: this.platformName, 
        // Twilio no da una URL pública, pero el SID sirve de recibo
        url: `twilio_sid:${response.data.sid}` 
      };

    } catch (error) {
      const axiosError = error as AxiosError;
      
      this.logger.error('Fallo al enviar mensaje por Twilio', {
        platform: this.platformName,
        state: 'error',
        statusCode: axiosError.response?.status,
        errorMessage: axiosError.message,
        responseData: axiosError.response?.data,
        stack: error.stack
      });

      return { 
        success: false, 
        platform: this.platformName, 
        error: error.message 
      };
    }
  }
}