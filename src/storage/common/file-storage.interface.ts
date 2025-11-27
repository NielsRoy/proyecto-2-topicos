import { ResourceType } from '../enum/resource-type.enum';

export interface StorageService {

  save(buffer: Buffer, fileName: string, resourceType: ResourceType): Promise<string>;
  
  read(fileId: string): Promise<Buffer>;

}