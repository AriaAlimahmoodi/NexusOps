import type { CryptoKey } from 'jose';
export declare function isJweToken(token: unknown): token is string;
export declare function decryptJweToken(token: string, privateKey: CryptoKey): Promise<string>;
export declare function decryptJweTokenData(data: Record<string, unknown>, privateKey: CryptoKey): Promise<Record<string, unknown>>;
