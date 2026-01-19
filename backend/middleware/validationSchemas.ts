import Joi from 'joi';

export const agentSchemas = {
    register: Joi.object({
        address: Joi.string().pattern(/^0x[a-fA-F0-0]{40}$/).required(),
        charter: Joi.string().max(500).required(),
        dailySpendingLimit: Joi.number().min(0).required(),
        monthlySpendingLimit: Joi.number().min(0).required(),
        transactionLimit: Joi.number().min(0).required()
    }),
    update: Joi.object({
        charter: Joi.string().max(500),
        dailySpendingLimit: Joi.number().min(0),
        monthlySpendingLimit: Joi.number().min(0),
        transactionLimit: Joi.number().min(0),
        isActive: Joi.boolean()
    }),
    registerCLI: Joi.object({
        address: Joi.string().pattern(/^0x[a-fA-F0-0]{40}$/).required(),
        name: Joi.string().max(100).required(),
        description: Joi.string().max(500).required(),
        spendingLimits: Joi.object({
            daily: Joi.number().min(0).required(),
            monthly: Joi.number().min(0).required(),
            perTx: Joi.number().min(0).required()
        }).required(),
        allowedTasks: Joi.array().items(Joi.string()).required()
    })
};
