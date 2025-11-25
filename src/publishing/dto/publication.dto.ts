import { IsInt } from 'class-validator';

export class PublicationDto {

  @IsInt()
  publicationId: number;

}