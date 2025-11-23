import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { EntityNotFoundError } from 'typeorm';

export interface DatabaseError {
  code?: string;
  detail?: string;
  // Se pueden añadir más propiedades comunes de errores de DB
}

export function isDatabaseError(error: unknown): error is DatabaseError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export class ErrorHandlerUtil {
  static handle(error: unknown): never {
    //console.error('error handler:', error);
    if (isDatabaseError(error)) {
      if (error.code === '23505') {
        // Violación de unique constraint
        throw new BadRequestException(error.detail);
      }

      if (error.code === '23503') {
        // Violación de foreign key constraint
        throw new NotFoundException(error.detail);
      }
    }

    if (error instanceof BadRequestException) {
      throw error;
    }

    if (error instanceof NotFoundException) {
      throw error;
    }

    if (error instanceof EntityNotFoundError) {
      throw new NotFoundException(error.message);
    }

    console.error('Unhandled error:', error);
    throw new InternalServerErrorException('Please check server logs');
  }
}