import { Body, Controller, Post } from "@nestjs/common";

@Controller('whatsapp')
export class WhatsappController {
  
  @Post('post')
  publish() {
    
  }

}