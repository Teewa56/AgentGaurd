export const SECURITY_CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_prod',
    JWT_EXPIRES_IN: '24h',
    BCRYPT_SALT_ROUNDS: 10,
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
    RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: 100 // limit each IP to 100 requests per windowMs
};
