import { Body, Controller, Post } from "@nestjs/common";

@Controller('instagram')
export class InstagramController {
  
  @Post('post')
  publish() {
    
  }

}