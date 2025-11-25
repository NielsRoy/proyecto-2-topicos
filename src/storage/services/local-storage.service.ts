import { Injectable } from '@nestjs/common';
import { ResourceType } from '../enum/resource-type.enum';
import path from 'path';
import * as fs from 'fs';

@Injectable()
export class LocalStorageService {

  private readonly storageDir = path.join(process.cwd(), 'storage');
  private readonly folders = new Map<ResourceType, string>([
    [ResourceType.image, 'images'],
    [ResourceType.video, 'videos']
  ]);

  save(
    buffer: Buffer,
    fileName: string,
    resourceType: ResourceType = ResourceType.auto
  ): string {
    const folder = this.folders.get(resourceType);
    if (!folder) throw new Error(`No existe una carpeta para el tipo de recurso: ${resourceType}`);
    const filePath = path.join(this.storageDir, folder, fileName);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  read(filepath: string) {
    if (!fs.existsSync(filepath)) {
      throw new Error(`El archivo de video no existe en la ruta: ${filepath}`);
    }
    return fs.readFileSync(filepath);
  }
}