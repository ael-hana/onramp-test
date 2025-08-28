import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UsePipes,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { StripePaymentService } from '../services/stripe-payment.service';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';
import {
  createPaymentSchema,
  paymentIntentIdSchema,
} from '../schemas/payment.schemas';

@Controller('payment')
export class PaymentController {
  constructor(private readonly stripeService: StripePaymentService) {}

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new JoiValidationPipe(createPaymentSchema))
  async createPayment(@Body() body: { amount: number; currency?: string }) {
    const result = await this.stripeService.createPaymentIntent(body.amount);

    return {
      success: true,
      message: `Payment Intent créé pour ${body.amount}€`,
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
    status: string;
    amount: number;
  }> {
    const result = await this.stripeService.getPaymentStatus(
      params.paymentIntentId,
    );

    return {
      success: true,
      paymentIntentId: params.paymentIntentId,
      status: result.status,
      amount: result.amount,
    };
  }

  @Get('test')
  testEndpoint() {
    return {
      success: true,
      message: 'Payment controller fonctionne !',
      timestamp: new Date().toISOString(),
    };
  }
}
