import { StripePaymentStatus, PaymentErrorCode } from '../enums/payment.enums';

// Interface pour les données de création de Payment Intent
export interface CreatePaymentIntentDto {
  readonly amount: number;
  readonly currency?: string;
  readonly description?: string;
}

// Interface pour la réponse de création de Payment Intent
export interface PaymentIntentResponse {
  readonly paymentIntentId: string;
  readonly clientSecret: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: StripePaymentStatus;
}

// Interface pour la réponse de statut de paiement
export interface PaymentStatusResponse {
  readonly status: StripePaymentStatus;
  readonly amount: number;
  readonly currency: string;
}

// Interface pour la réponse de confirmation de paiement
export interface PaymentConfirmationResponse {
  readonly status: StripePaymentStatus;
  readonly amount: number;
  readonly message: string;
  readonly confirmedAt: Date;
}

// Interface pour les erreurs standardisées
export interface PaymentError {
  readonly code: PaymentErrorCode;
  readonly message: string;
  readonly details?: string;
  readonly originalError?: unknown;
}

// Interface pour la configuration Stripe
export interface StripeConfig {
  readonly apiKey: string;
  readonly apiVersion: string;
  readonly webhookSecret?: string;
}
