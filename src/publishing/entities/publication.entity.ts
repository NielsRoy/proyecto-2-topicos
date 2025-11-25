import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SocialMedia } from '../enum/social-media.enum';
import { PublicationState } from '../enum/publication-state.enum';
import { ChatInput } from './chat-input.entity';
import { PublicationResponse } from '../interfaces/publication-response.interface';

@Entity('publication')
export class Publication {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  textContent: string;

  @Column('text')
  filepath: string;

  @Column('text')
  publicUrl: string;
  
  @Column('enum', { enum: SocialMedia })
  socialMedia: SocialMedia;

  @Column('enum', {
    enum: PublicationState,
    default: PublicationState.DRAFT
  })
  state: PublicationState;

  @Column('bool', {
    default: false,
  })
  isDeleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ChatInput, { nullable: false })
  chatInput: ChatInput;

  toPublicationResponse(): PublicationResponse {
    return {
      publicationId: this.id,
      textContent: this.textContent,
      fileUrl: this.publicUrl,
      socialMedia: this.socialMedia
    };
  }
}