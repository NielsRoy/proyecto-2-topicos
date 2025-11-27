import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishResult } from '../interfaces/publish-result.interface';
import { PublishingService } from '../../publishing/publishing.service';
import { LinkedInService } from '../services/linkedin.service';
import { SocialMedia } from '../../publishing/enum/social-media.enum';

@Controller('linkedin')
export class LinkedInController {
  
  constructor(
    private readonly linkedInService: LinkedInService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const { publicationId } = dto;
    const valid = await this.publishingService.validateTargetSocialMedia(publicationId, SocialMedia.LINKEDIN);
    if (!valid) throw new BadRequestException(`La publicación con id = ${publicationId} no esta destinada para la red social: ${SocialMedia.LINKEDIN}`);
    const data = await this.publishingService.getPublicationDataById(publicationId);
    const response = await this.linkedInService.publish(data);
    if (response.success) await this.publishingService.setPublicationAsPublished(publicationId);
    return response;
  }
}