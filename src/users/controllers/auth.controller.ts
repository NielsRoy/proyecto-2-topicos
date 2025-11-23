import { Controller, Get, Post, Body } from '@nestjs/common';
import { SignUpDto } from '../dto/sign-up.dto';
import { SignInDto } from '../dto/sign-in.dto';
import { User } from '../entities/user.entity';
import { RequireAuth } from '../decorators/require-auth.decorator';
import { GetAuthUser } from '../decorators/get-auth-user.decorator';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @Get('check-status')
  @RequireAuth()
  checkAuthStatus(@GetAuthUser() user: User) {
    return this.authService.checkStatus(user);
  }
}