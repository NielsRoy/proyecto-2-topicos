import { Injectable, OnModuleInit } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import { Readable } from 'stream';
import { ResourceType } from '../enum/resource-type.enum';
import { env } from '../../config/env.config';
import path from 'path';
import { HttpService } from '@nestjs/axios';
import { StorageService } from '../common/file-storage.interface';

@Injectable()
export class CloudinaryStorageService implements StorageService {

  private readonly folders = new Map<ResourceType, string>([
    [ResourceType.image, 'images'],
    [ResourceType.video, 'videos']
  ]);

  constructor(private readonly httpService: HttpService) {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  async save(
    buffer: Buffer,
    fileName: string,
    resourceType: ResourceType = ResourceType.auto
  ): Promise<string> {
    const folder = this.folders.get(resourceType);
    if (!folder) throw new Error(`No existe una carpeta para el tipo de recurso: ${resourceType}`);

    const nameWithoutExtension = path.parse(fileName).name;

    return new Promise((resolve, reject) => {
      // 1. Creamos el stream de subida de Cloudinary
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          resource_type: resourceType,
          public_id: nameWithoutExtension,
          // Nota: Al usar Buffers, 'use_filename' no funciona igual porque no hay "nombre de archivo" original en el buffer
          // Puedes pasar 'public_id' manualmente si quieres controlar el nombre
        },
        (error, result) => {
          if (error) {
            return reject(new Error(`Error subiendo a Cloudinary: ${error.message}`));
          }
          
          if (!result) {
            return reject(new Error('Cloudinary finalizó pero no retornó resultados.'));
          }
          
          resolve(result.secure_url);
        }
      );

      // 2. Convertimos el Buffer en un Stream legible y lo enviamos (pipe) a Cloudinary
      Readable.from(buffer).pipe(uploadStream);
    });
  }

  async read(fileUrl: string): Promise<Buffer> {
    try {
      if (!fileUrl) throw new Error('La URL del archivo es requerida');

      // Descargamos el archivo como un arraybuffer (datos binarios puros)
      const response = await this.httpService.axiosRef.get(fileUrl, {
        responseType: 'arraybuffer'
      });

      // Convertimos el resultado a un Buffer de Node.js
      return Buffer.from(response.data);
    } catch (error) {
      throw new Error(`Error al descargar el archivo de Cloudinary: ${error.message}`);
    }
  }
}