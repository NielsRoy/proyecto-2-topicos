import { Body, Controller, Post } from "@nestjs/common";
import { PublishingService } from "./publishing.service";
import { CreatePublicationDto } from "./dto/create-publication.dto";

@Controller()
export class PublishingController {

  constructor(private readonly publishingService: PublishingService) {}

  @Post('publication')
  getPostTextContent(@Body() dto: CreatePublicationDto) {
    return this.publishingService.publishFromChat(dto);
  }

  @Post('test')
  test(@Body() dto: CreatePublicationDto) {
    return this.publishingService.test(dto);
  }
}