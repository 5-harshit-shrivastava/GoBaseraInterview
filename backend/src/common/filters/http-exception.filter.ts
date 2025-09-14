import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../interfaces/error-response.interface';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: ErrorResponse;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        // Handle validation errors
        if (status === HttpStatus.BAD_REQUEST && Array.isArray(responseObj.message)) {
          errorResponse = {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: responseObj.message,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        } else {
          errorResponse = {
            code: this.getErrorCode(status),
            message: responseObj.message || exception.message,
            details: responseObj.details || null,
            timestamp: new Date().toISOString(),
            path: request.url,
          };
        }
      } else {
        errorResponse = {
          code: this.getErrorCode(status),
          message: exception.message,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
      }
    } else {
      // Handle non-HTTP exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        timestamp: new Date().toISOString(),
        path: request.url,
      };
    }

    response.status(status).json(errorResponse);
  }

  private getErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'TOO_MANY_REQUESTS';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'INTERNAL_SERVER_ERROR';
      default:
        return 'UNKNOWN_ERROR';
    }
  }
}