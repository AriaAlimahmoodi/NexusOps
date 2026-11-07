import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
export declare function getExternalSecretExpressionPaths(data: unknown): string[];
export declare function extractProviderKeysFromExpression(expression: string): string[];
export declare function extractProviderKeysFromCredentialData(data: ICredentialDataDecryptedObject): ReadonlySet<string>;
