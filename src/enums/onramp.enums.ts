// Enum pour les statuts métier d'on-ramp (business logic)
export enum OnRampStatus {
  // Phase initiale
  INITIATED = 'initiated', // Transaction créée

  // Phase paiement (Stripe)
  PAYMENT_PENDING = 'payment_pending', // En attente du paiement client
  PAYMENT_CONFIRMED = 'payment_confirmed', // Paiement Stripe réussi

  // Phase conversion crypto (Bridge) - pour plus tard
  CRYPTO_CONVERSION_PENDING = 'crypto_conversion_pending', // Conversion EUR→USDC en cours
  CRYPTO_CONVERTED = 'crypto_converted', // Conversion terminée

  // Phase transfert wallet
  WALLET_TRANSFER_PENDING = 'wallet_transfer_pending', // Transfert vers wallet en cours
  WALLET_TRANSFER_CONFIRMED = 'wallet_transfer_confirmed', // Transfert confirmé on-chain

  // Statuts finaux
  COMPLETED = 'completed', // OnRamp terminé avec succès
  FAILED = 'failed', // Échec à une étape
  EXPIRED = 'expired', // Transaction expirée
}

// Enum pour les phases du processus OnRamp
export enum OnRampPhase {
  PAYMENT = 'payment',
  CRYPTO_CONVERSION = 'crypto_conversion', // Phase Bridge
  WALLET_TRANSFER = 'wallet_transfer', // Phase transfert final
  COMPLETED = 'completed', // Terminé
}

// Enum pour les codes d'erreur OnRamp métier
export enum OnRampErrorCode {
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
  TRANSACTION_EXPIRED = 'TRANSACTION_EXPIRED',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  INVALID_WALLET_ADDRESS = 'INVALID_WALLET_ADDRESS',
}
