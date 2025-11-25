import { Body, Controller, Post } from '@nestjs/common';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { FacebookService } from '../services/facebook.service';
import { PublishingService } from '../../publishing/publishing.service';
import { PublishResult } from '../interfaces/publish-result.interface';

@Controller('facebook')
export class FacebookController {
  
  constructor(
    private readonly facebookService: FacebookService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const data = await this.publishingService.getPublicationDataById(dto.publicationId);
    return await this.facebookService.publish(data);
  }
}