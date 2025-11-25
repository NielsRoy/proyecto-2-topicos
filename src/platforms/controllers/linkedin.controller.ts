import { Body, Controller, Post } from '@nestjs/common';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishResult } from '../interfaces/publish-result.interface';
import { PublishingService } from '../../publishing/publishing.service';
import { LinkedInService } from '../services/linkedin.service';

@Controller('linkedin')
export class LinkedInController {
  
  constructor(
    private readonly linkedInService: LinkedInService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const data = await this.publishingService.getPublicationDataById(dto.publicationId);
    return await this.linkedInService.publish(data);
  }
}