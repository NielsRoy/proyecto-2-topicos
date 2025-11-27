import { Injectable } from '@nestjs/common';
import { ResourceType } from '../enum/resource-type.enum';
import path from 'path';
import * as fs from 'fs';
import { StorageService } from '../common/file-storage.interface';

@Injectable()
export class LocalStorageService implements StorageService {

  private readonly storageDir = path.join(process.cwd(), 'storage');
  private readonly folders = new Map<ResourceType, string>([
    [ResourceType.image, 'images'],
    [ResourceType.video, 'videos']
  ]);

  async save(
    buffer: Buffer,
    fileName: string,
    resourceType: ResourceType = ResourceType.auto
  ): Promise<string> {
    const folderName = this.folders.get(resourceType);
    if (!folderName) {
      throw new Error(`No existe una carpeta para el tipo de recurso: ${resourceType}`);
    }
    const directoryPath = path.join(this.storageDir, folderName);
    const filePath = path.join(directoryPath, fileName);
    await fs.promises.mkdir(directoryPath, { recursive: true });
    await fs.promises.writeFile(filePath, buffer);
    return filePath;
  }

  async read(filepath: string): Promise<Buffer> {
    try {
      await fs.promises.access(filepath);
    } catch (error) {
      throw new Error(`El archivo no existe en la ruta: ${filepath}`);
    }
    return await fs.promises.readFile(filepath);
  }
}