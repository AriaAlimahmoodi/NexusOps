export declare function redactSecretKeys(value: unknown): unknown;
export declare function redactSecretValuePatterns(text: string): string;
export declare function truncateForLlm(serialized: string, maxLength?: number): string;
export declare function isSecretKey(key: string): boolean;
