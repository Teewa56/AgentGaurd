// Basic validation helpers since we didn't install Joi/Zod
// In a production app, use 'zod' or 'joi'

export const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateEthAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const ValidationSchemas = {
    REGISTER_USER: {
        required: ['email', 'password'],
    },
    REGISTER_AGENT: {
        required: ['userId', 'address', 'charter'],
    }
};
