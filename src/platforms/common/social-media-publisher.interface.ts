import { PublishResult } from "./publis-result.interface";

export interface SocialMediaPublisher {

  readonly platformName: string;

  publish(content: string): Promise<PublishResult>;
}