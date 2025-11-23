import { Module } from '@nestjs/common';
import { HASH_SERVICE } from 'src/config/injection-tokens';
import { BcryptjsService } from './services/bcryptjs.service';
import { AuthService } from './services/auth.service';
import { UserService } from './services/user.service';
import { AuthController } from './controllers/auth.controller';
import { UserController } from './controllers/user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { env } from 'src/config/env.config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController, UserController],
  providers: [
    AuthService,
    UserService,
    JwtStrategy,
    {
      provide: HASH_SERVICE,
      useClass: BcryptjsService,
    },
  ],
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: env.APP_JWT_SECRET,
      signOptions: {
        expiresIn: env.APP_JWT_EXPIRATION,
      }
    }),
  ],
  exports: [
    HASH_SERVICE,
    AuthService,
    PassportModule,
    JwtModule,
    JwtStrategy,
    UserService,
    TypeOrmModule
  ],
})
export class UsersModule {}
