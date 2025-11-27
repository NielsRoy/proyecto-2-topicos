import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { FacebookService } from '../services/facebook.service';
import { PublishingService } from '../../publishing/publishing.service';
import { PublishResult } from '../interfaces/publish-result.interface';
import { SocialMedia } from '../../publishing/enum/social-media.enum';

@Controller('facebook')
export class FacebookController {
  
  constructor(
    private readonly facebookService: FacebookService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const { publicationId } = dto;
    const valid = await this.publishingService.validateTargetSocialMedia(publicationId, SocialMedia.FACEBOOK);
    if (!valid) throw new BadRequestException(`La publicación con id = ${publicationId} no esta destinada para la red social: ${SocialMedia.FACEBOOK}`);
    const data = await this.publishingService.getPublicationDataById(publicationId);
    const response = await this.facebookService.publish(data);
    if (response.success) await this.publishingService.setPublicationAsPublished(publicationId);
    return response;
  }
}