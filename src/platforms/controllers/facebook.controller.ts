import { Body, Controller, Post } from "@nestjs/common";

@Controller('facebook')
export class FacebookController {
  
  @Post('post')
  publish() {
    
  }

}