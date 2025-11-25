import { Module } from '@nestjs/common';
import { CloudinaryStorageService } from './services/cloudinary-storage.service';
import { LocalStorageService } from './services/local-storage.service';

@Module({
  providers: [CloudinaryStorageService, LocalStorageService],
  exports: [CloudinaryStorageService, LocalStorageService],
})
export class StorageModule {}
