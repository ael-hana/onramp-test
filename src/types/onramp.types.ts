import {
  OnRampStatus,
  OnRampPhase,
  OnRampErrorCode,
} from '../enums/onramp.enums';

// Interface pour créer une transaction OnRamp
export interface CreateOnRampDto {
  readonly amount: number;
  readonly currency?: string;
  readonly walletAddress: string;
  readonly description?: string;
}

// Interface pour une transaction OnRamp complète
export interface OnRampTransaction {
  readonly id: string;
  readonly amount: number;
  readonly currency: string;
  readonly walletAddress: string;
  readonly status: OnRampStatus;
  readonly currentPhase: OnRampPhase;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  // IDs des transactions techniques
  readonly stripePaymentIntentId?: string;
  readonly bridgeTransactionId?: string;

  // Historique des statuts
  readonly statusHistory: OnRampStatusHistoryItem[];
}

// Interface pour l'historique des statuts
export interface OnRampStatusHistoryItem {
  readonly status: OnRampStatus;
  readonly phase: OnRampPhase;
  readonly timestamp: Date;
  readonly details?: string;
}

// Interface pour la réponse d'initialisation OnRamp
export interface OnRampInitiationResponse {
  readonly transactionId: string;
  readonly status: OnRampStatus;
  readonly currentPhase: OnRampPhase;
  readonly paymentDetails: {
    readonly paymentIntentId: string;
    readonly clientSecret: string;
    readonly amount: number;
    readonly currency: string;
  };
  readonly createdAt: Date;
}

// Interface pour la réponse de statut OnRamp
export interface OnRampStatusResponse {
  readonly transactionId: string;
  readonly status: OnRampStatus;
  readonly currentPhase: OnRampPhase;
  readonly progress: {
    readonly completedSteps: number;
    readonly totalSteps: number;
    readonly percentage: number;
  };
  readonly details: {
    readonly amount: number;
    readonly currency: string;
    readonly walletAddress: string;
  };
  readonly statusHistory: OnRampStatusHistoryItem[];
  readonly updatedAt: Date;
}

// Interface pour les erreurs OnRamp
export interface OnRampError {
  readonly code: OnRampErrorCode;
  readonly message: string;
  readonly details?: string;
  readonly phase?: OnRampPhase;
}
