import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import * as Joi from 'joi';

@Injectable()
export class JoiValidationPipe implements PipeTransform {
  constructor(private schema: Joi.ObjectSchema) {}

  transform(value: unknown): unknown {
    const validationResult = this.schema.validate(value) as {
      error?: Joi.ValidationError;
      value: unknown;
    };

    if (validationResult.error) {
      const errorMessages = validationResult.error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value as unknown,
      }));

      throw new BadRequestException({
        message: "Données d'entrée invalides",
        errors: errorMessages,
        statusCode: 400,
      });
    }

    return validationResult.value;
  }
}
