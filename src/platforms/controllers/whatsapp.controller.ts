import { Body, Controller, Post } from '@nestjs/common';
import { PublishingService } from '../../publishing/publishing.service';
import { WhatsappService } from '../services/whatsapp.service';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishResult } from '../interfaces/publish-result.interface';

@Controller('whatsapp')
export class WhatsappController {
  
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const data = await this.publishingService.getPublicationDataById(dto.publicationId);
    return await this.whatsappService.publish(data);
  }

}