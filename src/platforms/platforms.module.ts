import { Module } from '@nestjs/common';
import { FacebookService } from './services/facebook.service';
import { LinkedInService } from './services/linkedin.service';
import { InstagramService } from './services/instagram.service';
import { SOCIAL_MEDIA_PUBLISHER } from '../config/injection-tokens';
import { HttpModule } from '@nestjs/axios';
import { TiktokAuthController } from './controllers/tiktok-auth.controller';
import { TiktokService } from './services/tiktok.service';

const platformServices = [
  FacebookService,
  InstagramService,
  LinkedInService,
  TiktokService,
];

@Module({
  controllers: [TiktokAuthController],
  imports: [HttpModule],
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
