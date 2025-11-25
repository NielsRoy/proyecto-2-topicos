import { Module } from '@nestjs/common';
import { FacebookService } from './services/facebook.service';
import { LinkedInService } from './services/linkedin.service';
import { InstagramService } from './services/instagram.service';
import { SOCIAL_MEDIA_PUBLISHER } from '../config/injection-tokens';
import { HttpModule } from '@nestjs/axios';
import { TiktokAuthController } from './controllers/tiktok-auth.controller';
import { TiktokService } from './services/tiktok.service';
import { WhatsappService } from './services/whatsapp.service';
import { StorageModule } from '../storage/storage.module';
import { PublishingModule } from '../publishing/publishing.module';
import { FacebookController } from './controllers/facebook.controller';
import { InstagramController } from './controllers/instagram.controller';
import { LinkedInController } from './controllers/linkedin.controller';
import { TikTokController } from './controllers/tiktok.controller';
import { WhatsappController } from './controllers/whatsapp.controller';

const platformServices = [
  FacebookService,
  InstagramService,
  LinkedInService,
  TiktokService,
  WhatsappService,
];

@Module({
  controllers: [
    TiktokAuthController,
    FacebookController,
    InstagramController,
    LinkedInController,
    TikTokController,
    WhatsappController,
  ],
  imports: [HttpModule, StorageModule, PublishingModule],
  providers: [
    ...platformServices,
    {
      provide: SOCIAL_MEDIA_PUBLISHER,
      useFactory: (...services) => services,
      inject: platformServices 
    },
  ],
  exports: [SOCIAL_MEDIA_PUBLISHER],
})
export class PlatformsModule {}
