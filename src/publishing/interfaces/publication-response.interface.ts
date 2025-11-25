import { SocialMedia } from '../enum/social-media.enum';

export interface PublicationResponse {
  publicationId: number;
  textContent: string;
  fileUrl: string;
  socialMedia: SocialMedia;
}