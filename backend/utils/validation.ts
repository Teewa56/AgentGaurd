import Joi from 'joi';

export const registerUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('user', 'agent', 'admin').default('user')
});

export const loginUserSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

export const registerAgentSchema = Joi.object({
    address: Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).required().messages({
        'string.pattern.base': 'Address must be a valid Ethereum address'
    }),
    charter: Joi.string().required(),
    dailySpendingLimit: Joi.number().min(0).required(),
    monthlySpendingLimit: Joi.number().min(0).required(),
    transactionLimit: Joi.number().min(0).required(),
    // userId is extracted from token, not body
});
