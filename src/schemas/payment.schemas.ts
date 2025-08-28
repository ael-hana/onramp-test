import * as Joi from 'joi';

// Schema pour créer un payment intent
export const createPaymentSchema = Joi.object({
  amount: Joi.number().positive().min(1).max(999999).required().messages({
    'number.base': 'Le montant doit être un nombre',
    'number.positive': 'Le montant doit être positif',
    'number.min': 'Le montant minimum est de 1€',
    'number.max': 'Le montant maximum est de 999,999€',
    'any.required': 'Le montant est obligatoire',
  }),

  currency: Joi.string()
    .valid('EUR', 'eur')
    .optional()
    .default('EUR')
    .messages({
      'string.base': 'La devise doit être une chaîne de  caractères',
      'any.only': 'Seule la devise EUR est acceptée pour le moment',
    }),
});

// Schema pour valider un payment intent ID
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
