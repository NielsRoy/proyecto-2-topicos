import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishingService } from '../../publishing/publishing.service';
import { PublishResult } from '../interfaces/publish-result.interface';
import { TiktokService } from '../services/tiktok.service';
import { SocialMedia } from '../../publishing/enum/social-media.enum';

@Controller('tiktok')
export class TikTokController {
  
  constructor(
    private readonly tiktokService: TiktokService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const { publicationId } = dto;
    const valid = await this.publishingService.validateTargetSocialMedia(publicationId, SocialMedia.TIKTOK);
    if (!valid) throw new BadRequestException(`La publicación con id = ${publicationId} no esta destinada para la red social: ${SocialMedia.TIKTOK}`);
    const data = await this.publishingService.getPublicationDataById(publicationId);
    const response = await this.tiktokService.publish(data);
    if (response.success) await this.publishingService.setPublicationAsPublished(publicationId);
    return response;
  }
}