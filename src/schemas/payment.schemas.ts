import * as Joi from 'joi';
import { PAYMENT_CONFIG } from '../constants/payment.constants';

// Schema pour créer un payment intent - utilise les constantes
export const createPaymentSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .min(PAYMENT_CONFIG.MIN_AMOUNT_EUR)
    .max(PAYMENT_CONFIG.MAX_AMOUNT_EUR)
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.positive': 'Le montant doit être positif',
      'number.min': `Le montant minimum est de ${PAYMENT_CONFIG.MIN_AMOUNT_EUR}€`,
      'number.max': `Le montant maximum est de ${PAYMENT_CONFIG.MAX_AMOUNT_EUR}€`,
      'any.required': 'Le montant est obligatoire',
    }),

  currency: Joi.string()
    .valid(...PAYMENT_CONFIG.SUPPORTED_CURRENCIES)
    .optional()
    .default(PAYMENT_CONFIG.DEFAULT_CURRENCY)
    .messages({
      'string.base': 'La devise doit être une chaîne de caractères',
      'any.only': `Seules les devises ${PAYMENT_CONFIG.SUPPORTED_CURRENCIES.join(
        ', ',
      )} sont acceptées`,
    }),

  description: Joi.string().max(500).optional().messages({
    'string.base': 'La description doit être une chaîne de caractères',
    'string.max': 'La description ne peut pas dépasser 500 caractères',
  }),
});

// Schema pour valider un payment intent ID - plus strict et sécurisé
export const paymentIntentIdSchema = Joi.object({
  paymentIntentId: Joi.string()
    .pattern(/^pi_[a-zA-Z0-9]{24}$/)
    .not(Joi.string().pattern(/_secret_/))
    .required()
    .messages({
      'string.base':
        "L'ID du payment intent doit être une chaîne de caractères",
      'string.pattern.base':
        "Format d'ID payment intent invalide (doit être pi_ suivi de 24 caractères, pas de clé privée)",
      'any.invalid':
        'Les clés privées (client secret) ne sont pas acceptées ici',
      'any.required': "L'ID du payment intent est obligatoire",
    }),
});
