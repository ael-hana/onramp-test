// Constantes pour Stripe
export const STRIPE_CONFIG = {
  API_VERSION: '2025-08-27.basil',
  CENTS_TO_EUROS: 100,
  PAYMENT_METHOD_TYPES: ['card'] as const,
  TEST_PAYMENT_METHOD: 'pm_card_visa',
} as const;

// Constant métier
export const PAYMENT_CONFIG = {
  MIN_AMOUNT_EUR: 1,
  MAX_AMOUNT_EUR: 999999,
  DEFAULT_CURRENCY: 'EUR',
  SUPPORTED_CURRENCIES: ['EUR', 'eur'] as const,
} as const;

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  CLIENT_SECRET_MISSING: 'Client secret manquant dans la réponse Stripe',
  PAYMENT_CREATION_FAILED: 'Erreur lors de la création du paiement',
  PAYMENT_STATUS_FAILED: 'Erreur lors de la récupération du statut',
  PAYMENT_CONFIRMATION_FAILED: 'Erreur lors de la confirmation du paiement',
  UNKNOWN_ERROR: 'Erreur inconnue',
} as const;

// Messages de succès
export const SUCCESS_MESSAGES = {
  PAYMENT_CONFIRMED: 'Paiement confirmé avec succès',
  PAYMENT_ALREADY_CONFIRMED: 'Paiement déjà confirmé avec succès',
} as const;
