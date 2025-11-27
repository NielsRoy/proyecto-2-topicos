import { Module } from '@nestjs/common';
import { CloudinaryStorageService } from './services/cloudinary-storage.service';
import { LocalStorageService } from './services/local-storage.service';
import { HttpModule } from '@nestjs/axios';
import { STORAGE_SERVICE } from '../config/injection-tokens';

@Module({
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: CloudinaryStorageService,
    },
  ],
  imports: [HttpModule],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}
