import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import Stripe from 'stripe';
import { AppConfigService } from '../config/app-config.service';
import {
  STRIPE_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  PAYMENT_CONFIG,
} from '../constants/payment.constants';
import {
  StripePaymentStatus,
  PaymentErrorCode,
  StripeErrorType,
} from '../enums/payment.enums';
import {
  CreatePaymentIntentDto,
  PaymentIntentResponse,
  PaymentStatusResponse,
  PaymentConfirmationResponse,
  StripeConfig,
} from '../types/payment.types';

@Injectable()
export class StripePaymentService {
  private readonly logger = new Logger(StripePaymentService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: AppConfigService) {
    const config: StripeConfig = {
      apiKey: this.configService.stripePrivateKey,
      apiVersion: STRIPE_CONFIG.API_VERSION,
    };

    this.stripe = new Stripe(config.apiKey, {
      apiVersion: config.apiVersion as Stripe.LatestApiVersion,
    });

    this.logger.log('Stripe service initialized successfully');
  }

  async createPaymentIntent(
    dto: CreatePaymentIntentDto,
  ): Promise<PaymentIntentResponse> {
    this.validatePaymentAmount(dto.amount);

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: this.convertEurosToCents(dto.amount),
        currency:
          dto.currency?.toLowerCase() ||
          PAYMENT_CONFIG.DEFAULT_CURRENCY.toLowerCase(),
        payment_method_types: [...STRIPE_CONFIG.PAYMENT_METHOD_TYPES],
        metadata: {
          description: dto.description || 'Paiement pour on-ramp crypto',
          service: 'onramp-backend',
          version: '1.0.0',
        },
      });

      this.validatePaymentIntentResponse(paymentIntent);

      const validatedStatus = this.validateAndMapStatus(paymentIntent.status);

      const response: PaymentIntentResponse = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: dto.amount,
        currency: dto.currency || PAYMENT_CONFIG.DEFAULT_CURRENCY,
        status: validatedStatus,
      };

      this.logger.log(`Payment Intent created: ${paymentIntent.id}`);
      return response;
    } catch (error) {
      this.logger.error('Failed to create payment intent', error);
      throw this.handleStripeError(
        error,
        ERROR_MESSAGES.PAYMENT_CREATION_FAILED,
      );
    }
  }

  async getPaymentStatus(
    paymentIntentId: string,
  ): Promise<PaymentStatusResponse> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      const validatedStatus = this.validateAndMapStatus(paymentIntent.status);

      const response: PaymentStatusResponse = {
        status: validatedStatus,
        amount: this.convertCentsToEuros(paymentIntent.amount),
        currency: paymentIntent.currency.toUpperCase(),
      };

      return response;
    } catch (error) {
      this.logger.error(
        `Failed to get payment status for: ${paymentIntentId}`,
        error,
      );
      throw this.handleStripeError(error, ERROR_MESSAGES.PAYMENT_STATUS_FAILED);
    }
  }

  async confirmPayment(
    paymentIntentId: string,
  ): Promise<PaymentConfirmationResponse> {
    try {
      const currentPaymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (currentPaymentIntent.status === StripePaymentStatus.SUCCEEDED) {
        return {
          status: StripePaymentStatus.SUCCEEDED,
          amount: this.convertCentsToEuros(currentPaymentIntent.amount),
          message: SUCCESS_MESSAGES.PAYMENT_ALREADY_CONFIRMED,
          confirmedAt: new Date(),
        };
      }

      const confirmedPaymentIntent = await this.stripe.paymentIntents.confirm(
        paymentIntentId,
        {
          payment_method: STRIPE_CONFIG.TEST_PAYMENT_METHOD,
        },
      );

      const validatedStatus = this.validateAndMapStatus(
        confirmedPaymentIntent.status,
      );

      const response: PaymentConfirmationResponse = {
        status: validatedStatus,
        amount: this.convertCentsToEuros(confirmedPaymentIntent.amount),
        message: SUCCESS_MESSAGES.PAYMENT_CONFIRMED,
        confirmedAt: new Date(),
      };

      this.logger.log(`Payment confirmed successfully: ${paymentIntentId}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to confirm payment: ${paymentIntentId}`, error);
      throw this.handleStripeError(
        error,
        ERROR_MESSAGES.PAYMENT_CONFIRMATION_FAILED,
      );
    }
  }

  // Méthodes utilitaires privées
  private validatePaymentAmount(amount: number): void {
    if (
      amount < PAYMENT_CONFIG.MIN_AMOUNT_EUR ||
      amount > PAYMENT_CONFIG.MAX_AMOUNT_EUR
    ) {
      throw new BadRequestException({
        code: PaymentErrorCode.INVALID_PAYMENT_AMOUNT,
        message: `Le montant doit être entre ${PAYMENT_CONFIG.MIN_AMOUNT_EUR}€ et ${PAYMENT_CONFIG.MAX_AMOUNT_EUR}€`,
        details: `Montant fourni: ${amount}€`,
      });
    }
  }

  private validatePaymentIntentResponse(
    paymentIntent: Stripe.PaymentIntent,
  ): void {
    if (!paymentIntent.client_secret) {
      throw new Error(ERROR_MESSAGES.CLIENT_SECRET_MISSING);
    }
  }

  private convertEurosToCents(euros: number): number {
    return Math.round(euros * STRIPE_CONFIG.CENTS_TO_EUROS);
  }

  private convertCentsToEuros(cents: number): number {
    return cents / STRIPE_CONFIG.CENTS_TO_EUROS;
  }

  private handleStripeError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Stripe.errors.StripeError) {
      if (error.type === StripeErrorType.INVALID_REQUEST_ERROR) {
        throw new BadRequestException({
          code: PaymentErrorCode.PAYMENT_INTENT_NOT_FOUND,
          message: 'Payment Intent introuvable ou invalide',
          details: error.message,
        });
      }
    }

    if (error instanceof BadRequestException) {
      throw error;
    }
    const message =
      error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
    throw new Error(`${defaultMessage}: ${message}`);
  }

  private validateAndMapStatus(stripeStatus: string): StripePaymentStatus {
    const validStatuses = Object.values(StripePaymentStatus) as string[];

    if (!validStatuses.includes(stripeStatus)) {
      this.logger.warn(`Unknown Stripe status received: ${stripeStatus}`);
    }

    return stripeStatus as StripePaymentStatus;
  }
}
