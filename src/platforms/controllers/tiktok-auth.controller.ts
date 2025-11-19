import { HttpService } from "@nestjs/axios";
import { Controller, Get, HttpException, HttpStatus, Query } from "@nestjs/common";
import { env } from "../../config/env.config";

@Controller('tiktok') // Esto define la ruta base como /tiktok (o /api/tiktok)
export class TiktokAuthController {

  private readonly CLIENT_KEY = env.TIKTOK_CLIENT_KEY
  private readonly CLIENT_SECRET = env.TIKTOK_CLIENT_SECRET
  // IMPORTANTE: Esta URL debe ser IDÉNTICA a la que registraste en TikTok Developers
  private readonly REDIRECT_URI = env.TIKTOK_REDIRECT_URI;

  constructor(private readonly httpService: HttpService) {}

  @Get('callback')
  async handleTiktokCallback(
    @Query('code') code: string, 
    @Query('error') error: string,
    @Query('scopes') scopes: string
  ) {
    // 1. Validación básica: ¿TikTok nos mandó un error?
    if (error) {
      throw new HttpException(
        `El usuario denegó el acceso o hubo error en TikTok: ${error}`, 
        HttpStatus.BAD_REQUEST
      );
    }

    // 2. Validación: ¿Llegó el código?
    if (!code) {
      throw new HttpException(
        'No se recibió el código de autorización (Authorization Code)', 
        HttpStatus.BAD_REQUEST
      );
    }

    console.log('Código recibido:', code); // Log para depuración en Vercel 

    try {
      // 4. Intercambio del CODE por el TOKEN
      // Documentación: https://developers.tiktok.com/doc/oauth-user-access-token-management
      
      const url = 'https://open.tiktokapis.com/v2/oauth/token/';
      
      // TikTok exige x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append('client_key', this.CLIENT_KEY);
      params.append('client_secret', this.CLIENT_SECRET);
      params.append('code', code);
      params.append('grant_type', 'authorization_code');
      params.append('redirect_uri', this.REDIRECT_URI);

      const response = await this.httpService.axiosRef.post(url, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
      });

      // 5. ÉXITO: Devolvemos el token al navegador para que lo copies
      const { access_token, refresh_token, open_id, expires_in } = response.data;

      return {
        status: 'Exito',
        instruction: 'Copia este access_token y ponlo en tus variables de entorno.',
        data: {
          access_token,
          refresh_token,
          scope_granted: scopes,
          expires_in_seconds: expires_in,
          open_id
        }
      };

    } catch (error) {
      // Manejo de errores robusto
      const errorData = error.response?.data || error.message;
      console.error('Error solicitando token a TikTok:', errorData);
      
      throw new HttpException({
        status: 'Error',
        message: 'Fallo al conectar con TikTok para obtener el token.',
        details: errorData
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}