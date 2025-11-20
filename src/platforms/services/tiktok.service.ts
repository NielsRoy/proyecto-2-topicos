import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosRequestConfig } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../common/publis-result.interface';
import { TikTokInitResponse, TikTokStatusResponse } from '../interfaces/tiktok.types';
import { env } from '../../config/env.config';

@Injectable()
export class TiktokService implements SocialMediaPublisher {
  readonly platformName = 'tiktok';
  private readonly logger = new Logger(TiktokService.name);
  
  private readonly baseUrl = "https://open.tiktokapis.com/v2/post/publish";
  
  // RUTA DEL VIDEO LOCAL
  // process.cwd() apunta a la raíz donde ejecutas npm run start (usualmente la raíz del proyecto)
  // Asegúrate de poner un archivo 'video_prueba.mp4' ahí.
  private readonly localVideoPath = path.join(process.cwd(), 'video_prueba.mp4');

  private readonly accessToken = env.TIKTOK_ACCESS_TOKEN; 

  private readonly requestConfig: AxiosRequestConfig = {
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
    },
  };

  private readonly MAX_RETRIES = 10; 
  private readonly RETRY_DELAY_MS = 5000; 

  constructor(private readonly httpService: HttpService) {}

  async publish(content: string): Promise<PublishResult> {
    this.logger.log(`Iniciando flujo de publicación (FILE_UPLOAD) en TikTok`, {
      action: 'start_publish',
      videoPath: this.localVideoPath
    });

    // 0. Verificar que el archivo existe antes de empezar
    if (!fs.existsSync(this.localVideoPath)) {
        return { 
            success: false, 
            platform: this.platformName, 
            error: `El archivo de video no existe en la ruta: ${this.localVideoPath}` 
        };
    }

    try {
      // PASO 1: Leer el archivo para obtener su tamaño
      const fileBuffer = fs.readFileSync(this.localVideoPath);
      const fileSize = fileBuffer.length;

      // PASO 2: Inicializar la carga (Pedirle permiso a TikTok y obtener la URL de subida)
      const { publishId, uploadUrl } = await this.initiatePublish(content, fileSize);

      this.logger.log(`Inicialización exitosa. Subiendo video a TikTok...`, {
        action: 'uploading_video',
        size: fileSize,
        uploadUrl: uploadUrl.substring(0, 30) + '...' // Logueamos solo una parte por seguridad
      });

      // PASO 3: Subir el binario del video a la URL que nos dio TikTok
      await this.uploadVideoFile(uploadUrl, fileBuffer);

      this.logger.log(`Video subido correctamente. Esperando procesamiento...`, {
        action: 'wait_processing',
        publishId: publishId
      });

      // PASO 4: Polling (Esperar a que TikTok procese)
      const finalPostId = await this.waitForProcessing(publishId);

      return { 
        success: true, 
        platform: this.platformName, 
        url: `https://www.tiktok.com/video/${finalPostId}` 
      };

    } catch (error) {
      this.logger.error('Falló el flujo de publicación en TikTok', {
        action: 'publish_failed',
        error: error.message,
        stack: error.stack
      });
      return { success: false, platform: this.platformName, error: error.message };
    }
  }

  /**
   * Paso 1: Decirle a TikTok que vamos a subir un archivo local.
   * Enviamos el tamaño exacto del archivo.
   * AJUSTE: Modo "Paranoico" de privacidad para evitar error 403 en Sandbox.
   */
  private async initiatePublish(title: string, fileSizeInBytes: number): Promise<{ publishId: string, uploadUrl: string }> {
    const url = `${this.baseUrl}/video/init/`;
    
    const payload = {
      post_info: {
        title: title,
        privacy_level: 'SELF_ONLY', 
        disable_duet: true,
        disable_comment: true,
        disable_stitch: true,
        video_cover_timestamp_ms: 1000
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: fileSizeInBytes,
        chunk_size: fileSizeInBytes, // Subiremos todo en un solo chunk
        total_chunk_count: 1
      }
    };

    try {
      const response = await this.httpService.axiosRef.post<TikTokInitResponse>(url, payload, this.requestConfig);

      if (response.data.error && response.data.error.code !== 'ok') {
         throw new Error(`TikTok API Error (Init): ${response.data.error.message}`);
      }

      const { publish_id, upload_url } = response.data.data;
      
      if (!publish_id || !upload_url) {
          throw new Error('La respuesta de TikTok no contiene publish_id o upload_url');
      }

      return { publishId: publish_id, uploadUrl: upload_url };

    } catch (error) {
      // Si falla, logueamos el payload que enviamos para depurar
      this.logger.error(`Error iniciando publicación con payload: ${JSON.stringify(payload)}`);
      this.handleAxiosError(error, 'Error iniciando upload en TikTok');
      throw error;
    }
  }

  /**
   * Paso 2: Realizar el PUT del archivo binario a la URL firmada por TikTok.
   * OJO: Aquí no se usa Authorization header, es una subida directa al bucket de TikTok.
   */
  private async uploadVideoFile(uploadUrl: string, fileBuffer: Buffer): Promise<void> {
    try {
      await this.httpService.axiosRef.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': fileBuffer.length,
          // Importante: TikTok es muy estricto con esto.
          // Para 1 chunk: "bytes 0-{size-1}/{size}"
          'Content-Range': `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`
        }
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error(`Error subiendo el binario del video`, {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        data: axiosError.response?.data
      });
      throw new Error(`Fallo al subir el archivo binario a TikTok: ${axiosError.message}`);
    }
  }

  /**
   * Paso 3: Polling (Idéntico al anterior, con la corrección del return)
   */
  private async waitForProcessing(publishId: string): Promise<string> {
    const url = `${this.baseUrl}/status/fetch/`;
    const payload = { publish_id: publishId };

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await this.httpService.axiosRef.post<TikTokStatusResponse>(url, payload, this.requestConfig);
        const statusData = response.data.data;

        this.logger.log(`Estado TikTok (Intento ${attempt}): ${statusData.status}`, {
            action: 'polling_status',
            status: statusData.status,
            reason: statusData.fail_reason
        });

        if (statusData.status === 'PUBLISH_COMPLETE') {
          const finalId = statusData.publicly_available_post_id?.[0] || 'unknown_id';
          return finalId;
        }

        if (statusData.status === 'FAILED') {
          throw new Error(`La publicación falló en TikTok. Razón: ${statusData.fail_reason}`);
        }

        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Tiempo de espera agotado procesando video.`);
        }

        await this.sleep(this.RETRY_DELAY_MS);

      } catch (error) {
        if (error.message.includes('La publicación falló') || error.message.includes('Tiempo de espera agotado')) {
            throw error;
        }
        
        this.logger.warn(`Error polling TikTok (Intento ${attempt}): ${error.message}`);
        if (attempt === this.MAX_RETRIES) throw error;
        
        await this.sleep(this.RETRY_DELAY_MS);
      }
    }
    throw new Error('Error inesperado en polling loop');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleAxiosError(error: any, context: string) {
    const axiosError = error as AxiosError;
    this.logger.error(`${context}`, {
      statusCode: axiosError.response?.status,
      apiErrorData: axiosError.response?.data,
      message: axiosError.message
    });
  }
}