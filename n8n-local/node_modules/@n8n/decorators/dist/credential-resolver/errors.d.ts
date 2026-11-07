export declare class CredentialResolverError extends Error {
    constructor(message: string);
}
export declare class CredentialResolverDataNotFoundError extends CredentialResolverError {
    constructor();
}
export declare class CredentialResolverValidationError extends CredentialResolverError {
    constructor(message: string);
}
