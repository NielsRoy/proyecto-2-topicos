import { Body, Controller, Post } from "@nestjs/common";

@Controller('tiktok')
export class TiktokController {
  
  @Post('post')
  publish() {
    
  }

}