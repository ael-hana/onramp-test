// Énumérations pour Bridge (conversion crypto)

// Statuts des transactions Bridge
export enum BridgeTransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  TRANSFER_PENDING = 'transfer_pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Statuts généraux Bridge
export enum BridgeStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

// Types d'opérations Bridge
export enum BridgeOperationType {
  CONVERSION = 'conversion',
  TRANSFER = 'transfer',
  SWAP = 'swap',
}

// Codes d'erreur Bridge
export enum BridgeErrorCode {
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  NOT_FOUND = 'NOT_FOUND',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  RATE_LIMITED = 'RATE_LIMITED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  BRIDGE_ERROR = 'BRIDGE_ERROR',
}
