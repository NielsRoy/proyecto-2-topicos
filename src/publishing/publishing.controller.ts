import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { PublishingService } from './publishing.service';
import { ChatInputDto } from './dto/chat-input.dto';
import { RequireAuth } from '../users/decorators/require-auth.decorator';
import { GetAuthUser } from '../users/decorators/get-auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

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

  @RequireAuth()
  @Get('messages')
  getChatInputsByUser(
    @Query() paginationDto: PaginationDto,
    @GetAuthUser() user: User,
  ) {
    return this.publishingService.getChatInputsByUserId(user.id, paginationDto);
  }

  @Get('message/:id/publications')
  getPublicationsByChatInputId(@Param('id', ParseIntPipe) id: number) {
    return this.publishingService.getPublicationsByChatInputId(id);
  }

  @Post('test')
  test(@Body() dto: ChatInputDto) {
    return this.publishingService.test(dto);
  }

  @Get()
  status() {
    return 'App running';
  }
}