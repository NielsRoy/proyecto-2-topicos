import { SocialMedia } from '../enum/social-media.enum';

export class createPublicationDto {
  textContent: string;
  //filepath: string;
  fileUrl: string;
  socialMedia: SocialMedia;
  chatInputId: number;
}