import { SocialMedia } from "../enum/social-media.enum";

export class createPublicationDto {
  textContent: string;
  filepath: string;
  publicUrl: string;
  socialMedia: SocialMedia;
  chatInputId: number;
}