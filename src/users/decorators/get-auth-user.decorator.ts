import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from '../entities/user.entity';

export const GetAuthUser = createParamDecorator(
  (data: keyof User, ctx: ExecutionContext): User | User[keyof User] => {
    const req = ctx.switchToHttp().getRequest<Request & { user: User }>();
    const user = req.user;

    if (!user)
      throw new InternalServerErrorException('User not found (request)');

    return !data ? user : user[data];
  },
);