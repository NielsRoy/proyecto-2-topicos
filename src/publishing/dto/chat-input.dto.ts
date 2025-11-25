import { IsNotEmpty, IsString } from 'class-validator';

export class ChatInputDto {
  
  @IsString()
  @IsNotEmpty()
  message: string;
}