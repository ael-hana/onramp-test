import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur interne du serveur';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        exceptionResponse &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const resp = exceptionResponse as {
          message?: string;
          errors?: unknown;
        };
        message = resp.message ?? message;
        details = resp.errors ?? null;
      } else if (exceptionResponse && typeof exceptionResponse === 'object') {
        message = JSON.stringify(exceptionResponse);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Erreur non gérée: ${exception.message}`,
        exception.stack,
      );
      message = "Une erreur inattendue s'est produite";
    } else {
      this.logger.error('Erreur inconnue', String(exception));
      message = "Une erreur inattendue s'est produite";
    }

    const errorResponse: {
      success: boolean;
      statusCode: number;
      message: string;
      errors?: unknown;
      timestamp: string;
      path: string;
    } = {
      success: false,
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (details) {
      errorResponse.errors = details;
    }

    response.status(status).json(errorResponse);
  }
}
