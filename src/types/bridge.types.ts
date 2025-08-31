import { BridgeTransactionStatus } from '../enums/bridge.enums';

// Interface pour les erreurs Bridge
export interface BridgeError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}

// Interface pour une transaction Bridge
export interface BridgeTransaction {
  id: string;
  externalId: string; // Stripe Payment Intent ID
  status: BridgeTransactionStatus;
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  targetAmount?: number;
  exchangeRate?: number;
  walletAddress: string;
  transactionHash?: string;
  createdAt: string;
  updatedAt: string;
}

// Interface pour initier une conversion
export interface BridgeConversionRequest {
  amount: number;
  sourceCurrency: string;
  targetCurrency: string;
  externalId: string;
  walletAddress: string;
}

// Interface pour la réponse de conversion
export interface BridgeConversionResponse {
  success: boolean;
  message: string;
  data: BridgeTransaction;
}

export interface BridgeApiTransfer {
  id: string;
  client_reference_id: string | null;
  state: string;
  on_behalf_of: string;
  currency: string;
  amount: string | null;
  developer_fee: string;

  source: {
    payment_rail: string;
    currency: string;
    external_account_id: string | null;
  };

  destination: {
    payment_rail: string;
    currency: string;
    to_address: string;
  };

  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601

  source_deposit_instructions?: {
    payment_rail: string;
    currency: string;
    amount: string;
    deposit_message: string;
    iban: string;
    bic: string;
    account_holder_name: string;
    bank_name: string;
    bank_address: string;
  };

  features?: {
    flexible_amount: boolean;
  };
}

// Interface pour initier un transfert
export interface BridgeTransferRequest {
  transactionId: string;
  amount: number;
  currency: string;
  destinationAddress: string;
}

// Interface pour la réponse de transfert
export interface BridgeTransferResponse {
  success: boolean;
  message: string;
  data: {
    transferId: string;
    transactionHash?: string;
    status: BridgeTransactionStatus;
    estimatedConfirmationTime?: string;
  };
}

// Interface pour la réponse de statut
export interface BridgeStatusResponse {
  success: boolean;
  message: string;
  data: BridgeTransaction;
}

// Interface pour le taux de change
export interface BridgeExchangeRate {
  rate: number;
  timestamp: string;
}
