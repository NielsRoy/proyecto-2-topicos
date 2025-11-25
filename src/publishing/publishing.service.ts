import { Injectable, Inject, Logger, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PromptService } from '../llm/services/prompt.service';
import { ChatInputDto } from './dto/chat-input.dto';
import type { LLMService } from '../llm/common/llm-service.interface';
import { LLM_SERVICE } from 'src/config/injection-tokens';
import { ImageGenerator } from '../llm/services/image-generator.service';
import { CloudinaryStorageService } from '../storage/services/cloudinary-storage.service';
import { InjectRepository } from '@nestjs/typeorm';
import { ChatInput } from './entities/chat-input.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PublicationResponse } from './interfaces/publication-response.interface';
import { VideoGenerator } from '../llm/services/video-generator.service';
import { Publication } from './entities/publication.entity';
import { SocialMedia } from './enum/social-media.enum';
import { createPublicationDto } from './dto/create-publication.dto';
import { PublicationData } from '../platforms/interfaces/publication-data.interface';

@Injectable()
export class PublishingService {
  private readonly logger = new Logger(PublishingService.name);

  constructor(
    @Inject(LLM_SERVICE)
    private readonly llmService: LLMService,

    private readonly promptService: PromptService,

    private readonly imageGenerator: ImageGenerator,
    private readonly videoGenerator: VideoGenerator,
    private readonly cloudinaryService: CloudinaryStorageService,

    @InjectRepository(ChatInput)
    private readonly chatInputRepository: Repository<ChatInput>,

    @InjectRepository(Publication)
    private readonly publicationRepository: Repository<Publication>,
  ) {}

  async generatePublications(dto: ChatInputDto, user: User): Promise<PublicationResponse[]> {
    const { message } = dto;
    
    this.logger.log(`Procesando solicitud: ${message}`);

    const chatInput = this.chatInputRepository.create({ ...dto, user });
    const newChatInput = await this.chatInputRepository.save(chatInput);
    const chatInputId = newChatInput.id;

    const enhancedPrompt = this.promptService.generate();
    
    const llmResponse = await this.llmService.generate(enhancedPrompt, message);
    const { dalle_prompt, sora_prompt } = llmResponse;
    const image = await this.imageGenerator.generate(dalle_prompt);
    const video = await this.videoGenerator.generate(sora_prompt);

    const facebook = await this.createPublication({
      textContent: llmResponse.facebook,
      filepath: image.filepath,
      publicUrl: image.publicUrl,
      socialMedia: SocialMedia.FACEBOOK,
      chatInputId,
    });

    const instagram = await this.createPublication({
      textContent: llmResponse.instagram,
      filepath: image.filepath,
      publicUrl: image.publicUrl,
      socialMedia: SocialMedia.INSTAGRAM,
      chatInputId,
    });

    const linkedin = await this.createPublication({
      textContent: llmResponse.linkedin,
      filepath: image.filepath,
      publicUrl: image.publicUrl,
      socialMedia: SocialMedia.LINKEDIN,
      chatInputId,
    });

    const whatsapp = await this.createPublication({
      textContent: llmResponse.whatsapp,
      filepath: image.filepath,
      publicUrl: image.publicUrl,
      socialMedia: SocialMedia.WHATSAPP,
      chatInputId,
    });

    const tiktok = await this.createPublication({
      textContent: llmResponse.tiktok,
      filepath: video.filepath,
      publicUrl: video.publicUrl,
      socialMedia: SocialMedia.TIKTOK,
      chatInputId,
    });

    return [ facebook, instagram, linkedin, whatsapp, tiktok ];
  }

  private async createPublication(dto: createPublicationDto): Promise<PublicationResponse> {
    try {
      const { textContent, filepath, publicUrl, socialMedia, chatInputId } = dto;
      const publication = this.publicationRepository.create({
        textContent,
        filepath,
        publicUrl,
        socialMedia,
        chatInput: { id: chatInputId },
      });
      const newPublication = await this.publicationRepository.save(publication);
      return newPublication.toPublicationResponse();
    } catch (e) {
      throw new InternalServerErrorException('Error al crear la publicación en base de datos', e);
    }
  }

  async getPublicationDataById(id: number): Promise<PublicationData> {
    try {
      const publication = await this.publicationRepository.findOneBy({ id });
      if (!publication) throw new NotFoundException(`La publicación con id = ${id} no existe.`);
      const { textContent, filepath, publicUrl } = publication;
      return { textContent, filepath, publicUrl };
    } catch (e) {
      throw new InternalServerErrorException('Error al obtener la publicación', e);
    }
  }

  async test(dto: ChatInputDto) {
    this.logger.log(`Procesando solicitud: ${dto.message}`);

    const response = this.imageGenerator.generate(dto.message);
    this.logger.log(response);

    return response;
    
    //const publisher = this.platformMap.get("whatsapp");
    //publisher?.publish(dto.message);

    //return enhancedPrompt;
  }
}