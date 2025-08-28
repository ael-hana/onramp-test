import { Injectable, BadRequestException } from '@nestjs/common';

import Stripe from 'stripe';
import { AppConfigService } from '../config/app-config.service';

@Injectable()
export class StripePaymentService {
  private stripe: Stripe;

  constructor(private configService: AppConfigService) {
    this.stripe = new Stripe(this.configService.stripePrivateKey, {
      apiVersion: '2025-08-27.basil',
    });
  }

  // Payment Intent IN EUR on Ramp
  async createPaymentIntent(amount: number): Promise<{
    paymentIntentId: string;
    clientSecret: string;
    amount: number;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: 'eur',
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          description: 'Paiement pour on-ramp crypto',
        },
      });

      if (!paymentIntent.client_secret) {
        throw new Error('Client secret manquant dans la réponse Stripe');
      }

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amount,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la création du paiement: ${message}`);
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<{
    status: string;
    amount: number;
  }> {
    try {
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      return {
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convertir les centimes en euros
      };
    } catch (error) {
      if (error instanceof Stripe.errors.StripeError) {
        if (error.type === 'StripeInvalidRequestError') {
          throw new BadRequestException({
            message: 'Payment Intent introuvable',
            details:
              "L'ID du payment intent fourni n'existe pas ou est invalide",
            code: 'PAYMENT_INTENT_NOT_FOUND',
          });
        }
      }

      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      throw new Error(`Erreur lors de la récupération du statut: ${message}`);
    }
  }
}
