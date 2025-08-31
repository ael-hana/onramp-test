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
import { OnRampService } from '../services/onramp.service';
import { JoiValidationPipe } from '../pipes/joi-validation.pipe';
import { createOnRampSchema, onRampIdSchema } from '../schemas/onramp.schemas';
import type { CreateOnRampDto, OnRampTransaction } from '../types/onramp.types';

@Controller('onramp')
export class OnRampController {
  private readonly logger = new Logger(OnRampController.name);

  constructor(private readonly onRampService: OnRampService) {}

  /**
   * Initie une transaction on-ramp complète (Stripe + Bridge)
   */
  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new JoiValidationPipe(createOnRampSchema))
  async initiateOnRamp(@Body() dto: CreateOnRampDto) {
    this.logger.log(`Initiation OnRamp pour ${dto.amount}€`);

    const result = await this.onRampService.initiateOnRamp(dto);

    return result;
  }

  /**
   * Traite la confirmation de paiement et initie la conversion Bridge
   */
  @Post('process-payment/:paymentIntentId')
  async processPaymentConfirmation(
    @Param('paymentIntentId') paymentIntentId: string,
  ) {
    this.logger.log(`Traitement confirmation paiement: ${paymentIntentId}`);

    const result =
      await this.onRampService.processPaymentConfirmation(paymentIntentId);

    return result; // Le service retourne déjà la structure complète
  }

  /**
   * Obtient le statut d'une transaction on-ramp
   */
  @Get('status/:transactionId')
  @UsePipes(new JoiValidationPipe(onRampIdSchema))
  async getOnRampStatus(@Param() params: { transactionId: string }) {
    this.logger.log(`Récupération statut transaction: ${params.transactionId}`);

    const result = await this.onRampService.getOnRampStatus(
      params.transactionId,
    );

    return result;
  }

  /**
   * Obtient toutes les transactions
   */
  @Get('transactions')
  async getAllTransactions(): Promise<{
    success: boolean;
    message: string;
    data: OnRampTransaction[];
  }> {
    this.logger.log('Récupération de toutes les transactions');

    const transactions = await this.onRampService.getAllTransactions();

    return {
      success: true,
      message: `${transactions.length} transaction(s) récupérée(s)`,
      data: transactions,
    };
  }
}
