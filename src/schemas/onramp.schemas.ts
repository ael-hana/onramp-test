import * as Joi from 'joi';
import { ONRAMP_CONFIG } from '../constants/onramp.constants';

// Schema pour créer une transaction OnRamp
export const createOnRampSchema = Joi.object({
  amount: Joi.number()
    .positive()
    .min(ONRAMP_CONFIG.MIN_AMOUNT_EUR)
    .max(ONRAMP_CONFIG.MAX_AMOUNT_EUR)
    .required()
    .messages({
      'number.base': 'Le montant doit être un nombre',
      'number.positive': 'Le montant doit être positif',
      'number.min': `Le montant minimum est de ${ONRAMP_CONFIG.MIN_AMOUNT_EUR}€`,
      'number.max': `Le montant maximum est de ${ONRAMP_CONFIG.MAX_AMOUNT_EUR}€`,
      'any.required': 'Le montant est obligatoire',
    }),

  currency: Joi.string()
    .valid(ONRAMP_CONFIG.SOURCE_CURRENCY)
    .optional()
    .default(ONRAMP_CONFIG.SOURCE_CURRENCY)
    .messages({
      'string.base': 'La devise doit être une chaîne de caractères',
      'any.only': `Seule la devise ${ONRAMP_CONFIG.SOURCE_CURRENCY} est acceptée`,
    }),

  description: Joi.string().max(500).optional().messages({
    'string.base': 'La description doit être une chaîne de caractères',
    'string.max': 'La description ne peut pas dépasser 500 caractères',
  }),
});

// Schema pour valider un ID de transaction OnRamp
export const onRampIdSchema = Joi.object({
  transactionId: Joi.string()
    .pattern(/^onramp_[0-9]+_[a-zA-Z0-9]{9}$/)
    .required()
    .messages({
      'string.base': "L'ID de transaction doit être une chaîne de caractères",
      'string.pattern.base': "Format d'ID de transaction OnRamp invalide",
      'any.required': "L'ID de transaction est obligatoire",
    }),
});
