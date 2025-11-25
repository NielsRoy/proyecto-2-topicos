import { Body, Controller, Get, Post } from "@nestjs/common";
import { PublishingService } from "./publishing.service";
import { ChatInputDto } from "./dto/chat-input.dto";
import { RequireAuth } from "../users/decorators/require-auth.decorator";
import { GetAuthUser } from "../users/decorators/get-auth-user.decorator";
import { User } from "../users/entities/user.entity";

@Controller()
export class PublishingController {

  constructor(private readonly publishingService: PublishingService) {}

  @RequireAuth()
  @Post('publication')
  getPostTextContent(
    @Body() dto: ChatInputDto,
    @GetAuthUser() user: User,
  ) {
    return this.publishingService.generatePublications(dto, user);
  }

  @Post('test')
  test(@Body() dto: ChatInputDto) {
    return this.publishingService.test(dto);
  }

  @Get()
  status() {
    return "App running";
  }
}