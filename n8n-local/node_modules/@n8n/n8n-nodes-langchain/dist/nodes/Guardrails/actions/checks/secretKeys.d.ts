import type { CreateCheckFn, GuardrailResult } from '../types';
export type SecretKeysConfig = {
    threshold: 'strict' | 'balanced' | 'permissive';
    customRegex?: string[];
};
export declare const secretKeysCheck: (data: string, config: SecretKeysConfig) => GuardrailResult;
export declare const createSecretKeysCheckFn: CreateCheckFn<SecretKeysConfig>;
