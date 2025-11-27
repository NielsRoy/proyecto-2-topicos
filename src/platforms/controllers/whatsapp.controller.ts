import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { PublishingService } from '../../publishing/publishing.service';
import { WhatsappService } from '../services/whatsapp.service';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishResult } from '../interfaces/publish-result.interface';
import { SocialMedia } from '../../publishing/enum/social-media.enum';

@Controller('whatsapp')
export class WhatsappController {
  
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const { publicationId } = dto;
    const valid = await this.publishingService.validateTargetSocialMedia(publicationId, SocialMedia.WHATSAPP);
    if (!valid) throw new BadRequestException(`La publicación con id = ${publicationId} no esta destinada para la red social: ${SocialMedia.WHATSAPP}`);
    const data = await this.publishingService.getPublicationDataById(dto.publicationId);
    const response = await this.whatsappService.publish(data);
    if (response.success) await this.publishingService.setPublicationAsPublished(publicationId);
    return response;
  }

}