import { Body, Controller, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { EventDto } from './dto/event.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('post')
  getPostTextContent(@Body() eventDto: EventDto) {
    return this.appService.sendRequestToAI(eventDto);
  }
}
