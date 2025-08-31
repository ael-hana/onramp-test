// Constantes pour l'intégration Bridge

export const BRIDGE_CONFIG = {
  API_KEY: process.env.BRIDGE_API_KEY,
  BASE_URL: process.env.BRIDGE_BASE_URL,

  // Configuration des devises
  SOURCE_CURRENCY: 'EUR',
  TARGET_CURRENCY: 'USDC',

  // Limites
  MIN_AMOUNT_EUR: 1,
  MAX_AMOUNT_EUR: 50000,

  // Timeouts
  REQUEST_TIMEOUT_MS: 30000,
  CONVERSION_TIMEOUT_HOURS: 2,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const;

export const BRIDGE_MESSAGES = {
  TRANSACTION_CREATED: 'Transaction Bridge créée avec succès',
  CONVERSION_INITIATED: 'Conversion EUR vers USDT initiée',
  CONVERSION_IN_PROGRESS: 'Conversion en cours',
  CONVERSION_COMPLETED: 'Conversion terminée avec succès',
  TRANSFER_INITIATED: 'Transfert vers wallet initié',
  TRANSFER_PENDING: 'Transfert en cours',
  TRANSFER_COMPLETED: 'Transfert terminé avec succès',

  // Messages d'erreur
  TRANSACTION_NOT_FOUND: 'Transaction Bridge introuvable',
  CONVERSION_FAILED: 'Échec de la conversion crypto',
  INSUFFICIENT_FUNDS: 'Fonds insuffisants',
  INVALID_WALLET: 'Adresse wallet invalide',
  NETWORK_ERROR: 'Erreur réseau Bridge',
  RATE_LIMIT_EXCEEDED: 'Limite de taux dépassée',
  UNAUTHORIZED: 'Clé API Bridge non autorisée',
} as const;

// Limites Bridge
export const BRIDGE_LIMITS = {
  MIN_CONVERSION_AMOUNT_EUR: 10,
  MAX_CONVERSION_AMOUNT_EUR: 10000,
  MIN_TRANSFER_AMOUNT_USDT: 10,
  MAX_TRANSFER_AMOUNT_USDT: 10000,
} as const;
