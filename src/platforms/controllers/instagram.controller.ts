import { Body, Controller, Post } from '@nestjs/common';
import { PublishingService } from '../../publishing/publishing.service';
import { InstagramService } from '../services/instagram.service';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishResult } from '../interfaces/publish-result.interface';

@Controller('instagram')
export class InstagramController {
  
  constructor(
    private readonly instagramService: InstagramService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const data = await this.publishingService.getPublicationDataById(dto.publicationId);
    return await this.instagramService.publish(data);
  }
}