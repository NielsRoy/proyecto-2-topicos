import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import { HashService } from '../common/hash-service.interface';

@Injectable()
export class BcryptjsService implements HashService {
  private readonly saltRounds = 10;

  hash(data: string): string {
    return bcrypt.hashSync(data, this.saltRounds);
  }

  compare(data: string, encrypted: string): boolean {
    return bcrypt.compareSync(data, encrypted);
  }
}