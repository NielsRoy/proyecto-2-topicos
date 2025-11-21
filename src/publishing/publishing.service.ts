import { Injectable, Inject, Logger } from '@nestjs/common';
import { PromptService } from '../llm/services/prompt.service';
import { SocialMediaPublisher } from '../platforms/common/social-media-publisher.interface';
import { CreatePublicationDto } from './dto/create-publication.dto';
import type { LlmService } from '../llm/common/llm-service.interface';
import { LLM_SERVICE, SOCIAL_MEDIA_PUBLISHER } from 'src/config/injection-tokens';
import { PublishResult } from '../platforms/common/publis-result.interface';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name); // O tu JsonLogger
  private platformMap = new Map<string, SocialMediaPublisher>();

  constructor(
    @Inject(LLM_SERVICE)
    private readonly llmService: LlmService,

    private readonly promptService: PromptService,

    // DIP: Inyectamos el array de publicadores usando el token
    @Inject(SOCIAL_MEDIA_PUBLISHER)
    private readonly publishers: SocialMediaPublisher[],
  ) {
    // Creamos un Map para acceso O(1)
    for (const publisher of this.publishers) {
      this.platformMap.set(publisher.platformName, publisher);
    }
    this.logger.log(`Servicio de publicación inicializado con ${this.publishers.length} plataformas.`);
  }

  async publishFromChat(dto: CreatePublicationDto): Promise<PublishResult[]> {
    this.logger.log(`Procesando solicitud: ${dto.message}`);
    const enhancedPrompt = this.promptService.generate(dto.message);
    const contentJson = await this.llmService.generateContent(enhancedPrompt);
    const publishPromises: Promise<PublishResult>[] = [];

    for (const [platform, content] of Object.entries(contentJson)) {
      const publisher = this.platformMap.get(platform);

      if (publisher) {
        publishPromises.push(publisher.publish(content as string));
      } else {
        this.logger.warn(`No se encontró publicador para la plataforma: ${platform}`);
      }
    }
    const results = await Promise.all(publishPromises);
    this.logger.log('Proceso de publicación completado.');
    return results;
  }

  async test(dto: CreatePublicationDto) {
    this.logger.log(`Procesando solicitud: ${dto.message}`);
    
    const publisher = this.platformMap.get("whatsapp");
    publisher?.publish(dto.message);

    //return enhancedPrompt;
  }
}