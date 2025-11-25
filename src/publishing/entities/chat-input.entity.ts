import { User } from '../../users/entities/user.entity';
import { 
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity('chat_input')
export class ChatInput {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  message: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { nullable: false })
  user: User;
}