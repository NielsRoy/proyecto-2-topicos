import { Controller, Delete, ParseIntPipe } from '@nestjs/common';
import { RequireAuth } from '../decorators/require-auth.decorator';
import { GetAuthUser } from '../decorators/get-auth-user.decorator';
import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Delete()
  @RequireAuth()
  remove(@GetAuthUser('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}