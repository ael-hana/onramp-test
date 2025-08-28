import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  HttpStatus,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { StripePaymentService } from '../services/stripe-payment.service';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';
import {
  createPaymentSchema,
  paymentIntentIdSchema,
} from '../schemas/payment.schemas';
import type {
  CreatePaymentIntentDto,
  PaymentIntentResponse,
  PaymentStatusResponse,
  PaymentConfirmationResponse,
} from '../types/payment.types';

@Controller('payment')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(private readonly stripeService: StripePaymentService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new JoiValidationPipe(createPaymentSchema))
  async createPayment(@Body() dto: CreatePaymentIntentDto): Promise<{
    success: boolean;
    message: string;
    data: PaymentIntentResponse;
  }> {
    this.logger.log(`Creating payment intent for amount: ${dto.amount}€`);

    const result = await this.stripeService.createPaymentIntent(dto);

    return {
      success: true,
      message: `Payment Intent créé pour ${dto.amount}€`,
      data: result,
    };
  }

  @Get('status/:paymentIntentId')
  @UsePipes(new JoiValidationPipe(paymentIntentIdSchema))
  async getPaymentStatus(
    @Param() params: { paymentIntentId: string },
  ): Promise<{
    success: boolean;
    paymentIntentId: string;
    data: PaymentStatusResponse;
  }> {
    this.logger.log(`Getting payment status for: ${params.paymentIntentId}`);

    const result = await this.stripeService.getPaymentStatus(
      params.paymentIntentId,
    );

    return {
      success: true,
      paymentIntentId: params.paymentIntentId,
      data: result,
    };
  }

  @Post('confirm/:paymentIntentId')
  @UsePipes(new JoiValidationPipe(paymentIntentIdSchema))
  async confirmPayment(@Param() params: { paymentIntentId: string }): Promise<{
    success: boolean;
    paymentIntentId: string;
    data: PaymentConfirmationResponse;
  }> {
    this.logger.log(`Confirming payment for: ${params.paymentIntentId}`);

    const result = await this.stripeService.confirmPayment(
      params.paymentIntentId,
    );

    return {
      success: true,
      paymentIntentId: params.paymentIntentId,
      data: result,
    };
  }

  @Get('health')
  healthCheck(): { success: boolean; message: string; timestamp: string } {
    return {
      success: true,
      message: 'Payment service is operational',
      timestamp: new Date().toISOString(),
    };
  }
}
