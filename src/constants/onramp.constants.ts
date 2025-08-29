// Constantes métier OnRamp
export const ONRAMP_CONFIG = {
  TRANSACTION_EXPIRY_HOURS: 24,
  MIN_AMOUNT_EUR: 1,
  MAX_AMOUNT_EUR: 50000, // Limite OnRamp plus élevée que Stripe
  DEFAULT_CURRENCY: 'EUR',
  TARGET_CURRENCY: 'USDC',

  // Configuration des phases
  TOTAL_PHASES: 3,
} as const;

// Messages OnRamp métier
export const ONRAMP_MESSAGES = {
  TRANSACTION_INITIATED: 'Transaction OnRamp initiée avec succès',
  PAYMENT_PENDING: 'En attente du paiement par carte',
  PAYMENT_CONFIRMED: 'Paiement confirmé, préparation de la conversion crypto',
  CONVERSION_PENDING: 'Conversion EUR vers USDC en cours',
  CONVERSION_COMPLETED: 'Conversion crypto terminée',
  TRANSFER_PENDING: 'Transfert vers votre wallet en cours',
  TRANSFER_CONFIRMED: 'Transfert confirmé sur la blockchain',
  COMPLETED: 'Transaction OnRamp terminée avec succès',

  // Messages d'erreur
  TRANSACTION_NOT_FOUND: 'Transaction OnRamp introuvable',
  INVALID_WALLET_ADDRESS: 'Adresse wallet invalide',
  AMOUNT_OUT_OF_BOUNDS: 'Montant hors limites autorisées',
} as const;

// Configuration de progression
export const PROGRESS_CONFIG = {
  STEPS: {
    INITIATED: { step: 1, percentage: 10 },
    PAYMENT_PENDING: { step: 2, percentage: 20 },
    PAYMENT_CONFIRMED: { step: 3, percentage: 40 },
    CRYPTO_CONVERSION_PENDING: { step: 4, percentage: 60 },
    CRYPTO_CONVERTED: { step: 5, percentage: 80 },
    WALLET_TRANSFER_PENDING: { step: 6, percentage: 90 },
    COMPLETED: { step: 7, percentage: 100 },
  },
  TOTAL_STEPS: 7,
} as const;
