import type { JSONRPCRequest } from './mcp.types';
type UnknownRecord = Record<string, unknown>;
export type HttpHeaderAuthDecryptedData = {
    name: string;
    value?: unknown;
};
export type WithDecryptedData<T> = UnknownRecord & {
    data: T;
};
export declare function hasHttpHeaderAuthDecryptedData(value: unknown): value is WithDecryptedData<HttpHeaderAuthDecryptedData>;
export type JwtPassphraseDecryptedData = {
    keyType?: 'passphrase' | string;
    secret: string;
};
export type JwtPemKeyDecryptedData = {
    keyType?: 'pemKey' | string;
    privateKey?: string;
    publicKey?: string;
};
export declare function hasJwtSecretDecryptedData(value: unknown): value is WithDecryptedData<JwtPassphraseDecryptedData>;
export declare function hasJwtPemKeyDecryptedData(value: unknown): value is WithDecryptedData<JwtPemKeyDecryptedData>;
export declare function isJSONRPCRequest(value: unknown): value is JSONRPCRequest;
export {};
