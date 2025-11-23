import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

export function RequireAuth() {
  return applyDecorators(
    UseGuards(AuthGuard()),
  );
}