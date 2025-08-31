import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { StripePaymentService } from './stripe-payment.service';
import { BridgeService } from './bridge.service';
import { StripePaymentStatus } from '../enums/payment.enums';
import { BridgeTransactionStatus } from '../enums/bridge.enums';
import { OnRampStatus, OnRampPhase } from '../enums/onramp.enums';
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

  // Stockage en mémoire des transactions (en production, utiliser une base de données)
  private transactions: Map<string, OnRampTransaction> = new Map();

  constructor(
    private readonly stripeService: StripePaymentService,
    private readonly bridgeService: BridgeService,
  ) {}

  /**
   * Initie une transaction on-ramp complète
   */
  async initiateOnRamp(
    dto: CreateOnRampDto,
  ): Promise<OnRampInitiationResponse> {
    try {
      this.validateOnRampRequest(dto);
      this.logger.log(`Initiation on-ramp pour ${dto.amount} EUR`);

      const walletAddress = process.env.WALLET_ADDRESS as string;

      const stripePayment = await this.stripeService.createPaymentIntent({
        amount: dto.amount,
        currency: ONRAMP_CONFIG.SOURCE_CURRENCY,
        description:
          dto.description || `On-ramp ${dto.amount}€ vers ${walletAddress}`,
      });

      const onRampTransaction: OnRampTransaction = {
        id: this.generateTransactionId(),
        stripePaymentIntentId: stripePayment.paymentIntentId,
        amount: dto.amount,
        currency: ONRAMP_CONFIG.SOURCE_CURRENCY,
        walletAddress: walletAddress,
        status: OnRampStatus.PAYMENT_PENDING,
        currentPhase: OnRampPhase.PAYMENT_AUTHORIZATION,
        statusHistory: [
          {
            status: OnRampStatus.PAYMENT_PENDING,
            phase: OnRampPhase.PAYMENT_AUTHORIZATION,
            timestamp: new Date().toISOString(),
            message: ONRAMP_MESSAGES.PAYMENT_PENDING,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      this.transactions.set(onRampTransaction.id, onRampTransaction);

      this.logger.log(`On-ramp initié: ${onRampTransaction.id}`);

      return {
        success: true,
        message: ONRAMP_MESSAGES.ONRAMP_INITIATED,
        data: {
          transactionId: onRampTransaction.id,
          paymentIntentId: stripePayment.paymentIntentId,
          clientSecret: stripePayment.clientSecret,
          amount: dto.amount,
          currency: ONRAMP_CONFIG.SOURCE_CURRENCY,
          status: OnRampStatus.PAYMENT_PENDING,
          progress: this.calculateProgress(OnRampStatus.PAYMENT_PENDING),
        },
      };
    } catch (error) {
      this.logger.error("Erreur lors de l'initiation on-ramp", error);
      throw error;
    }
  }

  /**
   * Traite la confirmation de paiement et initie la conversion Bridge
   */
  async processPaymentConfirmation(
    paymentIntentId: string,
  ): Promise<OnRampStatusResponse> {
    try {
      this.logger.log(`Traitement confirmation paiement: ${paymentIntentId}`);

      this.logger.log(`Transactions en mémoire (${this.transactions.size}):`, {
        transactionIds: Array.from(this.transactions.keys()),
        paymentIntentIds: Array.from(this.transactions.values()).map(
          (tx) => tx.stripePaymentIntentId,
        ),
      });

      const transaction = this.findTransactionByPaymentIntent(paymentIntentId);
      if (!transaction) {
        this.logger.error(
          `Transaction introuvable pour Payment Intent: ${paymentIntentId}`,
        );
        throw new BadRequestException('Transaction introuvable');
      }

      this.logger.log(`Transaction trouvée: ${transaction.id}`);

      const stripeStatus =
        await this.stripeService.getPaymentStatus(paymentIntentId);

      if (stripeStatus.status !== StripePaymentStatus.SUCCEEDED) {
        throw new BadRequestException('Paiement non confirmé');
      }

      this.updateTransactionStatus(
        transaction,
        OnRampStatus.CONVERSION_PENDING,
        OnRampPhase.CRYPTO_CONVERSION,
        ONRAMP_MESSAGES.CONVERSION_INITIATED,
      );

      try {
        const bridgeConversion = await this.bridgeService.initiateConversion(
          paymentIntentId,
          transaction.amount,
        );

        transaction.bridgeTransactionId = bridgeConversion.data.id;
        transaction.exchangeRate = bridgeConversion.data.exchangeRate;
        transaction.targetAmount = bridgeConversion.data.targetAmount;
        transaction.updatedAt = new Date().toISOString();

        this.updateTransactionStatus(
          transaction,
          OnRampStatus.CONVERSION_IN_PROGRESS,
          OnRampPhase.CRYPTO_CONVERSION,
          ONRAMP_MESSAGES.CONVERSION_IN_PROGRESS,
        );

        this.logger.log(
          `Conversion initiée pour transaction: ${transaction.id}`,
        );
      } catch (bridgeError) {
        this.logger.error('Erreur Bridge lors de la conversion', bridgeError);

        this.updateTransactionStatus(
          transaction,
          OnRampStatus.FAILED,
          OnRampPhase.CRYPTO_CONVERSION,
          'Erreur lors de la conversion crypto',
        );

        throw new BadRequestException(
          "Impossible d'initier la conversion crypto",
        );
      }

      return {
        success: true,
        message: ONRAMP_MESSAGES.CONVERSION_IN_PROGRESS,
        data: {
          transactionId: transaction.id,
          status: transaction.status,
          currentPhase: transaction.currentPhase,
          amount: transaction.amount,
          currency: transaction.currency,
          targetAmount: transaction.targetAmount,
          walletAddress: transaction.walletAddress,
          progress: this.calculateProgress(transaction.status),
          statusHistory: transaction.statusHistory,
          updatedAt: transaction.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error('Erreur lors du traitement de confirmation', error);
      throw error;
    }
  }

  /**
   * Obtient le statut actuel d'une transaction on-ramp
   */
  async getOnRampStatus(transactionId: string): Promise<OnRampStatusResponse> {
    try {
      const transaction = this.transactions.get(transactionId);
      if (!transaction) {
        throw new BadRequestException('Transaction introuvable');
      }

      // Si une transaction Bridge existe, vérifier son statut
      if (transaction.bridgeTransactionId) {
        await this.updateBridgeTransactionStatus(transaction);
      }

      return {
        success: true,
        message: 'Statut récupéré avec succès',
        data: {
          transactionId: transaction.id,
          status: transaction.status,
          currentPhase: transaction.currentPhase,
          amount: transaction.amount,
          currency: transaction.currency,
          targetAmount: transaction.targetAmount,
          walletAddress: transaction.walletAddress,
          progress: this.calculateProgress(transaction.status),
          statusHistory: transaction.statusHistory,
          updatedAt: transaction.updatedAt,
        },
      };
    } catch (error) {
      this.logger.error(`Erreur récupération statut: ${transactionId}`, error);
      throw error;
    }
  }

  /**
   * Obtient toutes les transactions
   */
  async getAllTransactions(): Promise<OnRampTransaction[]> {
    const transactionsList = Array.from(this.transactions.values());

    // Mettre à jour les statuts Bridge pour les transactions en cours
    for (const transaction of transactionsList) {
      if (
        transaction.bridgeTransactionId &&
        [
          OnRampStatus.CONVERSION_IN_PROGRESS,
          OnRampStatus.TRANSFER_PENDING,
        ].includes(transaction.status)
      ) {
        await this.updateBridgeTransactionStatus(transaction);
      }
    }

    return transactionsList.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  /**
   * Met à jour le statut d'une transaction Bridge
   */
  private async updateBridgeTransactionStatus(
    transaction: OnRampTransaction,
  ): Promise<void> {
    try {
      if (!transaction.bridgeTransactionId) return;

      const bridgeStatus = await this.bridgeService.getTransactionStatus(
        transaction.bridgeTransactionId,
      );

      const bridgeTransaction = bridgeStatus.data;
      // Mapper le statut Bridge vers le statut on-ramp
      switch (bridgeTransaction.status) {
        case BridgeTransactionStatus.PENDING:
          this.updateTransactionStatus(
            transaction,
            OnRampStatus.CONVERSION_IN_PROGRESS,
            OnRampPhase.CRYPTO_CONVERSION,
            'Conversion en cours',
          );
          break;

        case BridgeTransactionStatus.CONFIRMED:
          this.updateTransactionStatus(
            transaction,
            OnRampStatus.TRANSFER_PENDING,
            OnRampPhase.BLOCKCHAIN_TRANSFER,
            ONRAMP_MESSAGES.TRANSFER_INITIATED,
          );
          break;

        case BridgeTransactionStatus.TRANSFER_PENDING:
          this.updateTransactionStatus(
            transaction,
            OnRampStatus.TRANSFER_PENDING,
            OnRampPhase.BLOCKCHAIN_TRANSFER,
            ONRAMP_MESSAGES.TRANSFER_PENDING,
          );
          break;

        case BridgeTransactionStatus.COMPLETED:
          transaction.transactionHash = bridgeTransaction.transactionHash;
          this.updateTransactionStatus(
            transaction,
            OnRampStatus.COMPLETED,
            OnRampPhase.COMPLETED,
            ONRAMP_MESSAGES.TRANSFER_COMPLETED,
          );
          break;

        case BridgeTransactionStatus.FAILED:
          this.updateTransactionStatus(
            transaction,
            OnRampStatus.FAILED,
            OnRampPhase.CRYPTO_CONVERSION,
            'Conversion échouée',
          );
          break;
      }

      transaction.updatedAt = new Date().toISOString();
    } catch (error) {
      this.logger.error(
        `Erreur mise à jour statut Bridge: ${transaction.bridgeTransactionId}`,
        error,
      );
    }
  }

  /**
   * Met à jour le statut d'une transaction
   */
  private updateTransactionStatus(
    transaction: OnRampTransaction,
    status: OnRampStatus,
    phase: OnRampPhase,
    message: string,
  ): void {
    // Ne pas régresser le statut
    if (transaction.status === status) return;

    transaction.status = status;
    transaction.currentPhase = phase;
    transaction.updatedAt = new Date().toISOString();

    transaction.statusHistory.push({
      status,
      phase,
      timestamp: new Date().toISOString(),
      message,
    });
  }

  /**
   * Calcule le progrès basé sur le statut
   */
  private calculateProgress(status: OnRampStatus): {
    step: number;
    percentage: number;
  } {
    const progress = PROGRESS_CONFIG.STEPS[status] as
      | { step: number; percentage: number }
      | undefined;
    return progress ?? { step: 1, percentage: 10 };
  }
  /**
   * Trouve une transaction par Payment Intent ID
   */
  private findTransactionByPaymentIntent(
    paymentIntentId: string,
  ): OnRampTransaction | undefined {
    return Array.from(this.transactions.values()).find(
      (tx) => tx.stripePaymentIntentId === paymentIntentId,
    );
  }

  /**
   * Génère un ID de transaction unique
   */
  private generateTransactionId(): string {
    return `onramp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valide une requête on-ramp
   */
  private validateOnRampRequest(dto: CreateOnRampDto): void {
    if (!dto.amount || dto.amount <= 0) {
      throw new BadRequestException('Montant invalide');
    }

    if (dto.amount < ONRAMP_CONFIG.MIN_AMOUNT_EUR) {
      throw new BadRequestException(
        `Montant minimum: ${ONRAMP_CONFIG.MIN_AMOUNT_EUR} EUR`,
      );
    }

    if (dto.amount > ONRAMP_CONFIG.MAX_AMOUNT_EUR) {
      throw new BadRequestException(
        `Montant maximum: ${ONRAMP_CONFIG.MAX_AMOUNT_EUR} EUR`,
      );
    }

    const walletAddress = process.env.WALLET_ADDRESS;
    if (!walletAddress) {
      throw new BadRequestException('Adresse wallet non configurée');
    }
  }
}
