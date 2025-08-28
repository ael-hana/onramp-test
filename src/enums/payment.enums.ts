// Enum pour les statuts de paiement Stripe
export enum StripePaymentStatus {
  REQUIRES_PAYMENT_METHOD = 'requires_payment_method',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_ACTION = 'requires_action',
  PROCESSING = 'processing',
  REQUIRES_CAPTURE = 'requires_capture',
  CANCELED = 'canceled',
  SUCCEEDED = 'succeeded',
}

// Enum pour les codes d'erreur métier
export enum PaymentErrorCode {
  PAYMENT_INTENT_NOT_FOUND = 'PAYMENT_INTENT_NOT_FOUND',
  PAYMENT_CONFIRMATION_FAILED = 'PAYMENT_CONFIRMATION_FAILED',
  INVALID_PAYMENT_AMOUNT = 'INVALID_PAYMENT_AMOUNT',
  UNSUPPORTED_CURRENCY = 'UNSUPPORTED_CURRENCY',
}

// Enum pour les types d'erreur Stripe
export enum StripeErrorType {
  INVALID_REQUEST_ERROR = 'StripeInvalidRequestError',
  AUTHENTICATION_ERROR = 'StripeAuthenticationError',
  PERMISSION_ERROR = 'StripePermissionError',
  RATE_LIMIT_ERROR = 'StripeRateLimitError',
  CONNECTION_ERROR = 'StripeConnectionError',
}

// Enum pour les devises supportées
export enum SupportedCurrency {
  EUR = 'EUR',
  EUR_LOWERCASE = 'eur',
}
