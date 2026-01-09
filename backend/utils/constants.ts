export enum DisputeStatus {
    PENDING = 'Pending',
    ARBITRATING = 'Arbitrating',
    RESOLVED = 'Resolved',
    APPEALED = 'Appealed'
}

export enum TransactionStatus {
    INITIATED = 'Initiated',
    COMPLETED = 'Completed',
    DISPUTED = 'Disputed',
    REFUNDED = 'Refunded'
}

export const USER_ROLES = {
    USER: 'user',
    AGENT: 'agent',
    ADMIN: 'admin'
};

export const DEFAULT_PAGINATION = {
    PAGE: 1,
    LIMIT: 10
};
