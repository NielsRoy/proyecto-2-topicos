import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { QueryRunner, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { SignUpDto } from '../dto/sign-up.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { SignInDto } from '../dto/sign-in.dto';
import { instanceToInstance, instanceToPlain } from 'class-transformer';
import { AuthResponse } from '../interfaces/auth-response.interface';
import { HASH_SERVICE } from '../../config/injection-tokens';
import type { HashService } from '../common/hash-service.interface';
import { ErrorHandlerUtil } from '../../common/utils/error-handler.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly jwtService: JwtService,

    @Inject(HASH_SERVICE)
    private readonly hashAdapter: HashService,
  ) {}

  async signUp(
    signUpDto: SignUpDto,
    queryRunner?: QueryRunner,
  ): Promise<AuthResponse> {
    try {
      const { password, ...userData } = signUpDto;
      const user = this.userRepository.create({
        ...userData,
        password: this.hashAdapter.hash(password),
      });

      const savedUser = queryRunner
        ? await queryRunner.manager.save(user)
        : await this.userRepository.save(user);

      return {
        ...instanceToInstance(savedUser),
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      ErrorHandlerUtil.handle(error);
    }
  }

  async signIn(signInDto: SignInDto) {
    const { password, email } = signInDto;

    const user = await this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.password') //? Incluye el campo password (a pesar del select: false)
      .getOne();

    if (!user)
      throw new UnauthorizedException('Credentials are not valid (email)');

    if (!this.hashAdapter.compare(password, user.password))
      throw new UnauthorizedException('Credentials are not valid (password)');

    return {
      ...instanceToPlain(user),
      token: this.getJwtToken({ id: user.id }),
    };
  }

  checkStatus(user: User) {
    return {
      ...user,
      token: this.getJwtToken({ id: user.id }),
    };
  }

  private getJwtToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }
}