import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { StripePaymentStatus } from '../enums/payment.enums';
import {
  OnRampStatus,
  OnRampPhase,
  OnRampErrorCode,
} from '../enums/onramp.enums';
import {
  ONRAMP_CONFIG,
  ONRAMP_MESSAGES,
  PROGRESS_CONFIG,
} from '../constants/onramp.constants';
import {
  CreateOnRampDto,
  OnRampTransaction,
  OnRampInitiationResponse,
  OnRampStatusResponse,
} from '../types/onramp.types';

@Injectable()
export class OnRampService {
  private readonly logger = new Logger(OnRampService.name);

  // je vous aime mais flemme pour un test de faire une vraie BDD <3
  private transactions = new Map<string, OnRampTransaction>();

  constructor(private readonly stripeService: StripePaymentService) {}

  async initiateOnRamp(
    dto: CreateOnRampDto,
  ): Promise<OnRampInitiationResponse> {
    this.validateOnRampRequest(dto);

    try {
      const stripePayment = await this.stripeService.createPaymentIntent({
        amount: dto.amount,
        currency: dto.currency,
        description: dto.description || 'OnRamp crypto transaction',
      });

      const transactionId = this.generateTransactionId();
      const transaction = this.createOnRampTransaction(
        transactionId,
        dto,
        stripePayment.paymentIntentId,
      );

      this.transactions.set(transactionId, transaction);

      const response: OnRampInitiationResponse = {
        transactionId,
        status: OnRampStatus.INITIATED,
        currentPhase: OnRampPhase.PAYMENT,
        paymentDetails: {
          paymentIntentId: stripePayment.paymentIntentId,
          clientSecret: stripePayment.clientSecret,
          amount: stripePayment.amount,
          currency: stripePayment.currency,
        },
        createdAt: transaction.createdAt,
      };

      this.logger.log(`OnRamp transaction initiated: ${transactionId}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to initiate OnRamp transaction', error);
      throw new BadRequestException({
        code: OnRampErrorCode.PAYMENT_FAILED,
        message: "Impossible d'initier la transaction OnRamp",
        details: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }

  async processPaymentConfirmation(
    transactionId: string,
  ): Promise<OnRampStatusResponse> {
    const transaction = this.getTransaction(transactionId);

    if (!transaction.stripePaymentIntentId) {
      throw new BadRequestException({
        code: OnRampErrorCode.PAYMENT_FAILED,
        message: 'Payment Intent manquant pour cette transaction',
      });
    }

    try {
      const stripeResult = await this.stripeService.confirmPayment(
        transaction.stripePaymentIntentId,
      );

      const newStatus = this.mapStripeToOnRampStatus(stripeResult.status);

      this.updateTransactionStatus(
        transactionId,
        newStatus,
        OnRampPhase.PAYMENT,
      );

      this.logger.log(`Payment confirmed for OnRamp: ${transactionId}`);

      return this.getOnRampStatus(transactionId);
    } catch (error) {
      this.updateTransactionStatus(
        transactionId,
        OnRampStatus.FAILED,
        OnRampPhase.PAYMENT,
        'Échec du paiement',
      );
      this.logger.error(
        `Payment confirmation failed for OnRamp: ${transactionId}`,
        error,
      );
      throw error;
    }
  }

  getOnRampStatus(transactionId: string): OnRampStatusResponse {
    const transaction = this.getTransaction(transactionId);
    const progress = this.calculateProgress(transaction.status);

    const response: OnRampStatusResponse = {
      transactionId,
      status: transaction.status,
      currentPhase: transaction.currentPhase,
      progress: {
        completedSteps: progress.step,
        totalSteps: PROGRESS_CONFIG.TOTAL_STEPS,
        percentage: progress.percentage,
      },
      details: {
        amount: transaction.amount,
        currency: transaction.currency,
        walletAddress: transaction.walletAddress,
      },
      statusHistory: transaction.statusHistory,
      updatedAt: transaction.updatedAt,
    };

    return response;
  }

  getAllTransactions(): OnRampTransaction[] {
    return Array.from(this.transactions.values());
  }

  // Méthodes utilitaires privées
  private validateOnRampRequest(dto: CreateOnRampDto): void {
    if (
      dto.amount < ONRAMP_CONFIG.MIN_AMOUNT_EUR ||
      dto.amount > ONRAMP_CONFIG.MAX_AMOUNT_EUR
    ) {
      throw new BadRequestException({
        code: OnRampErrorCode.INVALID_AMOUNT,
        message: `Le montant doit être entre ${ONRAMP_CONFIG.MIN_AMOUNT_EUR}€ et ${ONRAMP_CONFIG.MAX_AMOUNT_EUR}€`,
        details: `Montant fourni: ${dto.amount}€`,
      });
    }

    // Validation basique adresse wallet (ethereum-like)
    if (!dto.walletAddress || !dto.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      throw new BadRequestException({
        code: OnRampErrorCode.INVALID_WALLET_ADDRESS,
        message: "Format d'adresse wallet invalide",
        details: "L'adresse doit être au format Ethereum (0x...)",
      });
    }
  }

  private generateTransactionId(): string {
    return `onramp_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private createOnRampTransaction(
    transactionId: string,
    dto: CreateOnRampDto,
    stripePaymentIntentId: string,
  ): OnRampTransaction {
    const now = new Date();

    return {
      id: transactionId,
      amount: dto.amount,
      currency: dto.currency || ONRAMP_CONFIG.DEFAULT_CURRENCY,
      walletAddress: dto.walletAddress,
      status: OnRampStatus.INITIATED,
      currentPhase: OnRampPhase.PAYMENT,
      createdAt: now,
      updatedAt: now,
      stripePaymentIntentId,
      statusHistory: [
        {
          status: OnRampStatus.INITIATED,
          phase: OnRampPhase.PAYMENT,
          timestamp: now,
          details: ONRAMP_MESSAGES.TRANSACTION_INITIATED,
        },
      ],
    };
  }

  private updateTransactionStatus(
    transactionId: string,
    newStatus: OnRampStatus,
    phase: OnRampPhase,
    details?: string,
  ): void {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) return;

    const updatedTransaction: OnRampTransaction = {
      ...transaction,
      status: newStatus,
      currentPhase: phase,
      updatedAt: new Date(),
      statusHistory: [
        ...transaction.statusHistory,
        {
          status: newStatus,
          phase: phase,
          timestamp: new Date(),
          details: details || this.getStatusMessage(newStatus),
        },
      ],
    };

    this.transactions.set(transactionId, updatedTransaction);
  }

  private getTransaction(transactionId: string): OnRampTransaction {
    const transaction = this.transactions.get(transactionId);
    if (!transaction) {
      throw new BadRequestException({
        code: OnRampErrorCode.TRANSACTION_NOT_FOUND,
        message: ONRAMP_MESSAGES.TRANSACTION_NOT_FOUND,
        details: `Transaction ID: ${transactionId}`,
      });
    }

    return transaction;
  }

  private mapStripeToOnRampStatus(
    stripeStatus: StripePaymentStatus,
  ): OnRampStatus {
    switch (stripeStatus) {
      case StripePaymentStatus.REQUIRES_PAYMENT_METHOD:
        return OnRampStatus.PAYMENT_PENDING;
      case StripePaymentStatus.SUCCEEDED:
        return OnRampStatus.PAYMENT_CONFIRMED;
      case StripePaymentStatus.CANCELED:
        return OnRampStatus.FAILED;
      default:
        return OnRampStatus.PAYMENT_PENDING;
    }
  }

  private calculateProgress(status: OnRampStatus): {
    step: number;
    percentage: number;
  } {
    const configKey = OnRampStatus[
      status
    ] as keyof typeof PROGRESS_CONFIG.STEPS;
    const progressData = PROGRESS_CONFIG.STEPS[configKey];

    return progressData || { step: 1, percentage: 10 };
  }

  private getStatusMessage(status: OnRampStatus): string {
    switch (status) {
      case OnRampStatus.PAYMENT_PENDING:
        return ONRAMP_MESSAGES.PAYMENT_PENDING;
      case OnRampStatus.PAYMENT_CONFIRMED:
        return ONRAMP_MESSAGES.PAYMENT_CONFIRMED;
      case OnRampStatus.COMPLETED:
        return ONRAMP_MESSAGES.COMPLETED;
      default:
        return 'Statut mis à jour';
    }
  }
}
