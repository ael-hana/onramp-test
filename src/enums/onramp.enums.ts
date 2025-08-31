// Enum pour les statuts métier d'on-ramp (business logic)
export enum OnRampStatus {
  // Phase initiale
  INITIATED = 'initiated', // Transaction créée

  // Phase paiement (Stripe)
  PAYMENT_PENDING = 'payment_pending', // En attente du paiement client
  PAYMENT_CONFIRMED = 'payment_confirmed', // Paiement Stripe réussi

  // Phase conversion crypto (Bridge)
  CONVERSION_PENDING = 'conversion_pending', // Conversion EUR→USDC en attente
  CONVERSION_IN_PROGRESS = 'conversion_in_progress', // Conversion EUR→USDC en cours
  CRYPTO_CONVERTED = 'crypto_converted', // Conversion terminée

  // Phase transfert wallet
  TRANSFER_PENDING = 'transfer_pending', // Transfert vers wallet en cours
  WALLET_TRANSFER_CONFIRMED = 'wallet_transfer_confirmed', // Transfert confirmé on-chain

  // Statuts finaux
  COMPLETED = 'completed', // OnRamp terminé avec succès
  FAILED = 'failed', // Échec à une étape
  EXPIRED = 'expired', // Transaction expirée
}

// Enum pour les phases du processus OnRamp
export enum OnRampPhase {
  PAYMENT_AUTHORIZATION = 'payment_authorization', // Autorisation du paiement
  PAYMENT = 'payment', // Paiement confirmé
  CRYPTO_CONVERSION = 'crypto_conversion', // Phase Bridge
  BLOCKCHAIN_TRANSFER = 'blockchain_transfer', // Phase transfert blockchain
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
