import { Body, Controller, Post } from '@nestjs/common';
import { PublicationDto } from '../../publishing/dto/publication.dto';
import { PublishingService } from '../../publishing/publishing.service';
import { PublishResult } from '../interfaces/publish-result.interface';
import { TiktokService } from '../services/tiktok.service';

@Controller('tiktok')
export class TikTokController {
  
  constructor(
    private readonly tiktokService: TiktokService,
    private readonly publishingService: PublishingService,
  ) {}

  @Post('publish')
  async publish(@Body() dto: PublicationDto): Promise<PublishResult> {
    const data = await this.publishingService.getPublicationDataById(dto.publicationId);
    return await this.tiktokService.publish(data);
  }
}