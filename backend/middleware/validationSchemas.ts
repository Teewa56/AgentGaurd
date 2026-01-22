import Joi from 'joi';

const ethereumAddress = Joi.string().regex(/^0x[a-fA-F0-9]{40}$/).messages({
    'string.pattern.base': 'Address must be a valid Ethereum address'
});

export const authSchemas = {
    register: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(8).required(),
        role: Joi.string().valid('user', 'agent', 'admin').default('user'),
        walletAddress: ethereumAddress.required()
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        walletAddress: ethereumAddress.required()
    })
};

export const agentSchemas = {
    register: Joi.object({
        address: ethereumAddress.required(),
        name: Joi.string().max(100),
        description: Joi.string().max(1000),
        charter: Joi.string().max(1000).required(),
        dailySpendingLimit: Joi.string().regex(/^\d+$/).required().messages({
            'string.pattern.base': 'Daily spending limit must be a numeric string (Wei)'
        }),
        monthlySpendingLimit: Joi.string().regex(/^\d+$/).required(),
        transactionLimit: Joi.string().regex(/^\d+$/).required()
    }),
    update: Joi.object({
        name: Joi.string().max(100),
        description: Joi.string().max(1000),
        charter: Joi.string().max(1000),
        dailySpendingLimit: Joi.string().regex(/^\d+$/),
        monthlySpendingLimit: Joi.string().regex(/^\d+$/),
        transactionLimit: Joi.string().regex(/^\d+$/),
        isActive: Joi.boolean()
    }),
    registerCLI: Joi.object({
        address: ethereumAddress.required(),
        name: Joi.string().max(100).required(),
        description: Joi.string().max(1000).required(),
        spendingLimits: Joi.object({
            daily: Joi.string().regex(/^\d+$/).required(),
            monthly: Joi.string().regex(/^\d+$/).required(),
            perTx: Joi.string().regex(/^\d+$/).required()
        }).required(),
        allowedTasks: Joi.array().items(Joi.string()).required()
    })
};
