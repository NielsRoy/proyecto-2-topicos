import { IsNotEmpty, IsString } from "class-validator";

export class CreatePublicationDto {
  
  @IsString()
  @IsNotEmpty()
  message: string;
}