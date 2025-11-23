import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
// import { DatabaseUtil } from '../../common/utils/database.util';
import { Exclude } from 'class-transformer';
// import { Role } from '../enums/role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text', {
    unique: true,
  })
  email: string;

  @Column('text', {
    select: false,
  })
  @Exclude()
  password: string;

  @Column('text')
  fullName: string;

  @Column('bool', {
    default: false,
  })
  isDeleted: boolean;

  // @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  // createdAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  // @Column('enum', {
  //   enum: Role,
  // })
  // role: Role;

  // @BeforeInsert()
  // checkFieldsBeforeInsert() {
  //   this.email = this.email.trim();
  //   this.firstName = DatabaseUtil.normalizeText(this.firstName);
  //   this.lastName = DatabaseUtil.normalizeText(this.lastName);
  // }

  // @BeforeUpdate()
  // checkFieldsBeforeUpdate() {
  //   this.checkFieldsBeforeInsert();
  // }
}