import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { BRIDGE_CONFIG, BRIDGE_MESSAGES } from '../constants/bridge.constants';
import { BridgeTransactionStatus } from '../enums/bridge.enums';
import {
  BridgeTransaction,
  BridgeConversionResponse,
  BridgeStatusResponse,
  BridgeError,
  BridgeApiTransfer,
} from '../types/bridge.types';

@Injectable()
export class BridgeService {
  private readonly logger = new Logger(BridgeService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly httpService: HttpService) {
    this.apiKey = process.env.BRIDGE_API_KEY || '';
    this.baseUrl = process.env.BRIDGE_BASE_URL || '';

    if (!this.apiKey) {
      throw new Error('BRIDGE_API_KEY manquante');
    }

    if (!this.baseUrl) {
      throw new Error('BRIDGE_BASE_URL manquante');
    }

    this.logger.log('Service Bridge initialisé:', {
      baseUrl: this.baseUrl,
      hasApiKey: !!this.apiKey,
    });
  }

  /**
   * Initie un transfert EUR vers USDT via Bridge
   */
  async initiateConversion(
    paymentIntentId: string,
    amount: number,
  ): Promise<BridgeConversionResponse> {
    try {
      this.logger.log(`Initiation transfert Bridge pour ${amount} EUR → USDT`);

      const transferRequest = {
        on_behalf_of: `ad3adf88-6dd4-4368-954d-c4caa6a6d058`,
        source: {
          payment_rail: 'sepa',
          currency: 'eur',
        },
        destination: {
          payment_rail: 'ethereum',
          currency: 'usdc',
          to_address: process.env.WALLET_ADDRESS as string,
        },
        features: {
          flexible_amount: true,
        },
      };

      this.logger.log('Requête Bridge /transfers');

      // Générer une clé d'idempotence unique
      const idempotencyKey = `onramp_${paymentIntentId}_${Date.now()}`;

      const response = await firstValueFrom(
        this.httpService.post<BridgeApiTransfer>(
          `${this.baseUrl}/transfers`,
          transferRequest,
          {
            headers: {
              'Api-Key': this.apiKey,
              'Idempotency-Key': idempotencyKey,
              'Content-Type': 'application/json',
            },
            timeout: BRIDGE_CONFIG.REQUEST_TIMEOUT_MS,
          },
        ),
      );

      const bridgeData = response.data;

      this.logger.log(`Transfert Bridge créé: ${bridgeData.id}`, {
        status: bridgeData.state,
      });

      const bridgeTransaction: BridgeTransaction = {
        id: bridgeData.id,
        externalId: paymentIntentId,
        status: this.mapBridgeStatus(bridgeData.state),
        amount: bridgeData.amount !== null ? parseFloat(bridgeData.amount) : 0,
        sourceCurrency:
          bridgeData.currency?.toUpperCase() || BRIDGE_CONFIG.SOURCE_CURRENCY,
        targetCurrency:
          bridgeData.destination?.currency?.toUpperCase() ||
          BRIDGE_CONFIG.TARGET_CURRENCY,
        targetAmount:
          bridgeData.amount !== null ? parseFloat(bridgeData.amount) : 0,
        walletAddress:
          bridgeData.destination?.to_address ||
          process.env.WALLET_ADDRESS ||
          '',
        createdAt: bridgeData.created_at || new Date().toISOString(),
        updatedAt: bridgeData.updated_at || new Date().toISOString(),
      };

      if (this.baseUrl.includes('sandbox')) {
        setTimeout(() => {
          this.simulateFundsReceived(bridgeData.id).catch((err) => {
            this.logger.error('Erreur lors de la simulation de funds', err);
          });
        }, 20000);
      }

      return {
        success: true,
        message: BRIDGE_MESSAGES.CONVERSION_INITIATED,
        data: bridgeTransaction,
      };
    } catch (error) {
      this.logger.error('Erreur transfert Bridge', {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        status: this.isHttpError(error) ? error.response.status : undefined,
        data: this.isHttpError(error) ? error.response.data : undefined,
      });
      throw new Error(JSON.stringify(this.handleBridgeError(error)));
    }
  }

  /**
   * Vérifie le statut d'un transfert Bridge
   */
  async getTransactionStatus(
    transactionId: string,
  ): Promise<BridgeStatusResponse> {
    try {
      this.logger.log(`Vérification statut transfert: ${transactionId}`);

      const response = await firstValueFrom(
        this.httpService.get<BridgeApiTransfer>(
          `${this.baseUrl}/transfers/${transactionId}`,
          {
            headers: {
              'Api-Key': this.apiKey,
            },
            timeout: BRIDGE_CONFIG.REQUEST_TIMEOUT_MS,
          },
        ),
      );

      const bridgeData = response.data;

      this.logger.log(`Statut reçu pour ${transactionId}:`, {
        state: bridgeData.state,
      });

      const transaction: BridgeTransaction = {
        id: bridgeData.id,
        externalId: bridgeData.client_reference_id || '',
        status: this.mapBridgeStatus(bridgeData.state),
        amount: bridgeData.amount !== null ? parseFloat(bridgeData.amount) : 0,
        sourceCurrency:
          bridgeData.source?.currency?.toUpperCase() ||
          BRIDGE_CONFIG.SOURCE_CURRENCY,
        targetCurrency:
          bridgeData.destination?.currency?.toUpperCase() ||
          BRIDGE_CONFIG.TARGET_CURRENCY,
        targetAmount:
          bridgeData.amount !== null ? parseFloat(bridgeData.amount) : 0,
        walletAddress: bridgeData.destination?.to_address || '',
        createdAt: bridgeData.created_at,
        updatedAt: bridgeData.updated_at,
      };

      return {
        success: true,
        message: 'Statut récupéré avec succès',
        data: transaction,
      };
    } catch (error) {
      this.logger.error(`Erreur récupération statut: ${transactionId}`, {
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        status: this.isHttpError(error) ? error.response.status : undefined,
      });
      throw new Error(JSON.stringify(this.handleBridgeError(error)));
    }
  }

  /**
   * Simule la réception des fonds en mode sandbox
   */
  private async simulateFundsReceived(transferId: string): Promise<void> {
    try {
      this.logger.log(`Simulation fonds reçus: ${transferId}`);

      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/transfers/${transferId}/test-funds-received`,
          {},
          {
            headers: {
              'Api-Key': this.apiKey,
              'Content-Type': 'application/json',
            },
            timeout: BRIDGE_CONFIG.REQUEST_TIMEOUT_MS,
          },
        ),
      );

      this.logger.log(
        `Fonds simulés pour ${transferId} - Bridge va traiter automatiquement`,
      );
    } catch (error) {
      this.logger.error(
        `Erreur simulation ${transferId}:`,
        error instanceof Error ? error.message : 'Erreur inconnue',
      );
    }
  }

  /**
   * Mappe les statuts Bridge vers nos enums
   */
  private mapBridgeStatus(bridgeStatus: string): BridgeTransactionStatus {
    switch (bridgeStatus) {
      case 'awaiting_funds':
        return BridgeTransactionStatus.PENDING;
      case 'funds_received':
        return BridgeTransactionStatus.CONFIRMED;
      case 'payment_submitted':
        return BridgeTransactionStatus.TRANSFER_PENDING;
      case 'payment_processed':
        return BridgeTransactionStatus.COMPLETED;
      case 'failed':
        return BridgeTransactionStatus.FAILED;
      default:
        this.logger.warn(`Statut Bridge inconnu: ${bridgeStatus}`);
        return BridgeTransactionStatus.PENDING;
    }
  }

  /**
   * Gestion des erreurs Bridge
   */
  private handleBridgeError(error: unknown): BridgeError {
    if (this.isHttpError(error)) {
      const status = error.response.status;
      const data = error.response.data as Record<string, unknown>;

      return {
        code: status === 401 ? 'UNAUTHORIZED' : 'BRIDGE_ERROR',
        message: (data?.message as string) || error.message || 'Erreur Bridge',
        details: data?.errors || error.message || 'Détails indisponibles',
        statusCode: status,
      };
    } else {
      return {
        code: 'BRIDGE_ERROR',
        message: 'Erreur réseau Bridge',
        details: error instanceof Error ? error.message : 'Erreur inconnue',
        statusCode: 500,
      };
    }
  }

  /**
   * Type guard pour vérifier si c'est une erreur HTTP
   */
  private isHttpError(error: unknown): error is {
    response: { status: number; data: unknown };
    message: string;
  } {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      typeof (error as Record<string, unknown>).response === 'object' &&
      (error as Record<string, unknown>).response !== null &&
      'status' in
        ((error as Record<string, unknown>).response as Record<string, unknown>)
    );
  }
}
