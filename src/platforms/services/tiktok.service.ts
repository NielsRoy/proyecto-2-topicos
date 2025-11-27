import { Inject, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { SocialMediaPublisher } from '../common/social-media-publisher.interface';
import { PublishResult } from '../interfaces/publish-result.interface';
import { TikTokInitResponse, TikTokStatusResponse } from '../interfaces/tiktok.types';
import { env } from '../../config/env.config';
import { PublicationData } from '../interfaces/publication-data.interface';
import { STORAGE_SERVICE } from '../../config/injection-tokens';
import type { StorageService } from '../../storage/common/file-storage.interface';

@Injectable()
export class TiktokService implements SocialMediaPublisher {
  readonly platformName = 'tiktok';
  private readonly logger = new Logger('TiktokService');
  private readonly plogger = new Logger('TikTok');

  private readonly baseUrl = "https://open.tiktokapis.com/v2/post/publish";

  private accessToken = env.TIKTOK_ACCESS_TOKEN; 
  private refreshToken = env.TIKTOK_REFRESH_TOKEN; 
  private clientKey = env.TIKTOK_CLIENT_KEY;       
  private clientSecret = env.TIKTOK_CLIENT_SECRET; 

  private readonly tiktokApi: AxiosInstance;

  private readonly MAX_RETRIES = 10; 
  private readonly RETRY_DELAY_MS = 5000; 

  constructor(
    @Inject(STORAGE_SERVICE)
    private readonly storageService: StorageService,
  ) {
    this.tiktokApi = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
      },
    });

    // 2. Configuramos los interceptores SOLO en esta instancia privada
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request Interceptor: Inyectar token automáticamente
    this.tiktokApi.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response Interceptor: Manejo de error 401 (Token expirado)
    this.tiktokApi.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;
        
        // Verificamos si es un error 401 y no es un reintento
        if (originalRequest && error.response?.status === 401 && !originalRequest['_retry']) {
          this.logger.warn('Token TikTok expirado (401). Intentando refrescar...');
          
          originalRequest['_retry'] = true;

          try {
            await this.refreshAccessToken();

            // Importante: Actualizamos el header del request original con el nuevo token
            originalRequest.headers['Authorization'] = `Bearer ${this.accessToken}`;

            // Reintentamos la petición usando la misma instancia privada
            return this.tiktokApi(originalRequest);
          } catch (refreshError) {
            this.logger.error('No se pudo refrescar el token.', refreshError);
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Refresca el token llamando a la API de OAuth.
   * IMPORTANTE: Usa 'axios' global (o una instancia nueva) para evitar bucles con los interceptores.
   */
  private async refreshAccessToken(): Promise<void> {
    const url = 'https://open.tiktokapis.com/v2/oauth/token/';
    const params = new URLSearchParams();
    params.append('client_key', this.clientKey);
    params.append('client_secret', this.clientSecret);
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', this.refreshToken);

    try {
      this.plogger.log('API Request: Refresh Token', { method: 'POST', url });
      // Usamos axios puro (importado) aquí, NO this.tiktokApi
      const response = await axios.post(url, params);
      this.plogger.log('API Response: Refresh Token', { statusCode: response.status, success: true });
      
      const { access_token, refresh_token } = response.data;
      if (!access_token) throw new Error('Respuesta inválida al refrescar token');

      this.accessToken = access_token;
      if (refresh_token) this.refreshToken = refresh_token;

      this.logger.log('Token TikTok renovado correctamente.');
      
      // TODO: Guardar tokens en BD/Redis aquí

    } catch (error) {
      const axiosError = error as AxiosError;
      this.plogger.error('API Error: Refresh Token', { 
        statusCode: axiosError.response?.status,
        apiError: axiosError.response?.data,
        message: axiosError.message
      });
      throw error;
    }
  }

  async publish(data: PublicationData): Promise<PublishResult> {
    const { textContent, fileUrl } = data;
    if (!fileUrl) {
      return { 
        success: false, platform: this.platformName, error: `El archivo de video es obligatorio` 
      };
    }
    this.logger.log(`Iniciando flujo TikTok (FILE_UPLOAD)...`);

    try {
      const fileBuffer = await this.storageService.read(fileUrl);
      const fileSize = fileBuffer.length;

      // PASO 1: Inicializar la carga (Pedirle permiso a TikTok y obtener la URL de subida)
      const { data } = await this.initiatePublish(textContent, fileSize);
      const { publish_id, upload_url } = data;

      this.logger.log(`Subiendo video a URL firmada...`);

      // PASO 2: Subir el binario del video a la URL que nos dio TikTok
      await this.uploadVideoFile(upload_url, fileBuffer);
      this.logger.log(`Video subido. Esperando procesamiento (ID: ${publish_id})...`);

      // PASO 3: Polling (Esperar a que TikTok procese)
      const finalPostId = await this.waitForProcessing(publish_id);
      this.logger.log('Publicación completada en TikTok');
      return { success: true, platform: this.platformName };
    } catch (error) {
      this.logger.error(`Falló TikTok: ${error.message}`);
      return { success: false, platform: this.platformName, error: error.message };
    }
  }

  /**
   * Paso 1: Decirle a TikTok que vamos a subir un archivo local.
   * Enviamos el tamaño exacto del archivo.
   */
  private async initiatePublish(title: string, fileSizeInBytes: number): Promise<TikTokInitResponse> {
    const url = `/video/init/`;
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
      this.plogger.log('API Request: Init Publish', { method: 'POST', url, payload });
      const response = await this.tiktokApi.post<TikTokInitResponse>(url, payload);
      this.plogger.log('API Response: Init Publish', { statusCode: response.status, data: response.data });

      if (response.data.error && response.data.error.code !== 'ok') {
        throw new Error(`TikTok API Error (Init): ${response.data.error.message}`);
      }

      const { publish_id, upload_url } = response.data.data;
      
      if (!publish_id || !upload_url) {
        throw new Error('La respuesta de TikTok no contiene publish_id o upload_url');
      }
      return response.data;
    } catch (error) {
      this.handleAxiosError(error, 'Init Publish Error');
      throw error;
    }
  }

  /**
   * Paso 2: Realizar el PUT del archivo binario a la URL firmada por TikTok.
   * OJO: Aquí no se usa Authorization header, es una subida directa al bucket de TikTok.
   */
  private async uploadVideoFile(uploadUrl: string, fileBuffer: Buffer): Promise<void> {
    try {
      this.plogger.log('API Request: Upload Video Binary', { method: 'PUT', url: uploadUrl, size: fileBuffer.length });
      await axios.put(uploadUrl, fileBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': fileBuffer.length,
          // Importante: TikTok es muy estricto con esto.
          // Para 1 chunk: "bytes 0-{size-1}/{size}"
          'Content-Range': `bytes 0-${fileBuffer.length - 1}/${fileBuffer.length}`
        }
      });
      this.plogger.log('API Response: Upload Video Binary', { statusCode: 200, statusText: 'OK' });
    } catch (error) {
      const axiosError = error as AxiosError;
      this.plogger.error('API Error: Upload Video Binary', {
        statusCode: axiosError.response?.status,
        apiError: axiosError.response?.data,
        message: axiosError.message
      });
      throw new Error(`Fallo al subir el archivo binario a TikTok: ${axiosError.message}`);
    }
  }

  /**
   * Paso 3: Polling
   */
  private async waitForProcessing(publishId: string): Promise<string> {
    const url = `/status/fetch/`;
    const payload = { publish_id: publishId };

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.plogger.log(`API Request: Check Status (Intento ${attempt})`, { method: 'POST', url, payload });
        const response = await this.tiktokApi.post<TikTokStatusResponse>(url, payload);
        const statusData = response.data.data;

        this.plogger.log(`API Response: Check Status (Intento ${attempt})`, { statusCode: response.status, data: response.data });

        if (statusData.status === 'PUBLISH_COMPLETE') {
          const finalId = statusData.publicly_available_post_id?.[0] || 'unknown_id';
          return finalId;
        }

        if (statusData.status === 'FAILED') {
          throw new Error(`La publicación en TikTok falló. Razón: ${statusData.fail_reason}`);
        }

        if (attempt === this.MAX_RETRIES) {
          throw new Error(`Tiempo de espera agotado procesando video.`);
        }

        await this.sleep(this.RETRY_DELAY_MS);
      } catch (error) {
        if (!error.message.includes('API Error')) {
          this.handleAxiosError(error, 'Check Status Error');
          throw error;
        }
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
    this.plogger.error(`API Error: ${context}`, {
      statusCode: axiosError.response?.status,
      apiErrorData: axiosError.response?.data,
      message: axiosError.message
    });
  }
}