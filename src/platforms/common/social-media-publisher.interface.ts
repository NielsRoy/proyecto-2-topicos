import { PublicationData } from '../interfaces/publication-data.interface';
import { PublishResult } from '../interfaces/publish-result.interface';

export interface SocialMediaPublisher {

  readonly platformName: string;

  publish(data: PublicationData): Promise<PublishResult>;
}