import { OnRampStatus, OnRampPhase } from '../enums/onramp.enums';

// Interface pour créer une transaction OnRamp
export interface CreateOnRampDto {
  amount: number;
  currency?: string;
  description?: string;
}

// Interface pour l'historique des statuts
export interface OnRampStatusHistoryItem {
  status: OnRampStatus;
  phase: OnRampPhase;
  timestamp: string;
  message?: string;
}

// Interface pour une transaction OnRamp complète
export interface OnRampTransaction {
  id: string;
  amount: number;
  currency: string;
  walletAddress: string;
  status: OnRampStatus;
  currentPhase: OnRampPhase;
  createdAt: string;
  updatedAt: string;

  // IDs des transactions techniques
  stripePaymentIntentId?: string;
  bridgeTransactionId?: string;

  // Données de conversion
  exchangeRate?: number;
  targetAmount?: number;
  transactionHash?: string;

  // Historique des statuts
  statusHistory: OnRampStatusHistoryItem[];
}

// Interface pour la réponse d'initialisation OnRamp
export interface OnRampInitiationResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
    currency: string;
    status: OnRampStatus;
    progress: {
      step: number;
      percentage: number;
    };
  };
}

// Interface pour la réponse de statut OnRamp
export interface OnRampStatusResponse {
  success: boolean;
  message: string;
  data: {
    transactionId: string;
    status: OnRampStatus;
    currentPhase: OnRampPhase;
    amount: number;
    currency: string;
    targetAmount?: number;
    walletAddress: string;
    progress: {
      step: number;
      percentage: number;
    };
    statusHistory: OnRampStatusHistoryItem[];
    updatedAt: string;
  };
}

// Interface pour les erreurs OnRamp
export interface OnRampError {
  code: string;
  message: string;
  details?: unknown;
  statusCode?: number;
}
