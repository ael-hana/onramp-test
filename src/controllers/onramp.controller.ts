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
import type {
  CreateOnRampDto,
  OnRampInitiationResponse,
  OnRampStatusResponse,
  OnRampTransaction,
} from '../types/onramp.types';

@Controller('onramp')
export class OnRampController {
  private readonly logger = new Logger(OnRampController.name);

  constructor(private readonly onRampService: OnRampService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new JoiValidationPipe(createOnRampSchema))
  async initiateOnRamp(@Body() dto: CreateOnRampDto): Promise<{
    success: boolean;
    message: string;
    data: OnRampInitiationResponse;
  }> {
    this.logger.log(
      `Initiating OnRamp for amount: ${dto.amount}€ to wallet: ${dto.walletAddress}`,
    );

    const result = await this.onRampService.initiateOnRamp(dto);

    return {
      success: true,
      message: 'Transaction OnRamp initiée avec succès',
      data: result,
    };
  }

  @Post(':transactionId/confirm-payment')
  @UsePipes(new JoiValidationPipe(onRampIdSchema))
  async confirmPayment(@Param() params: { transactionId: string }): Promise<{
    success: boolean;
    message: string;
    data: OnRampStatusResponse;
  }> {
    this.logger.log(`Confirming payment for OnRamp: ${params.transactionId}`);

    const result = await this.onRampService.processPaymentConfirmation(
      params.transactionId,
    );

    return {
      success: true,
      message: 'Paiement traité avec succès',
      data: result,
    };
  }

  @Get(':transactionId/status')
  @UsePipes(new JoiValidationPipe(onRampIdSchema))
  getOnRampStatus(@Param() params: { transactionId: string }): {
    success: boolean;
    data: OnRampStatusResponse;
  } {
    this.logger.log(`Getting OnRamp status for: ${params.transactionId}`);

    const result = this.onRampService.getOnRampStatus(params.transactionId);

    return {
      success: true,
      data: result,
    };
  }

  @Get('transactions')
  getAllTransactions(): {
    success: boolean;
    data: OnRampTransaction[];
    count: number;
  } {
    this.logger.log('Getting all OnRamp transactions');

    const transactions = this.onRampService.getAllTransactions();

    return {
      success: true,
      data: transactions,
      count: transactions.length,
    };
  }

  @Get('health')
  healthCheck(): {
    success: boolean;
    message: string;
    service: string;
    timestamp: string;
  } {
    return {
      success: true,
      message: 'OnRamp service is operational',
      service: 'onramp-orchestrator',
      timestamp: new Date().toISOString(),
    };
  }
}
