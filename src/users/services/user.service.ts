import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { QueryRunner, Repository } from 'typeorm';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ErrorHandlerUtil } from '../../common/utils/error-handler.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number) {
    try {
      return await this.userRepository.findOneByOrFail({ id });
    } catch (error) {
      ErrorHandlerUtil.handle(error);
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    queryRunner?: QueryRunner,
  ): Promise<User | void> {
    try {
      const user = await this.userRepository.preload({
        ...updateUserDto,
        id,
      });

      if (!user) return;

      const savedUser = queryRunner
        ? await queryRunner.manager.save(user)
        : await this.userRepository.save(user);

      return savedUser;
    } catch (error) {
      ErrorHandlerUtil.handle(error);
    }
  }

  async remove(id: number): Promise<User> {
    try {
      await this.userRepository.update(id, { isDeleted: true });
      const user = await this.userRepository.findOneByOrFail({ id });
      return user;
    } catch (error) {
      ErrorHandlerUtil.handle(error);
    }
  }
}