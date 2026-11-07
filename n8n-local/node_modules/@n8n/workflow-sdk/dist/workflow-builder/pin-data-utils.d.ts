import type { NodeInstance } from '../types/base';
export declare function hasNewCredential(node: NodeInstance<string, string, unknown>): boolean;
export declare function isHttpRequestOrWebhook(type: string): boolean;
export declare function isDataTableWithoutTable(node: NodeInstance<string, string, unknown>): boolean;
export declare function shouldGeneratePinData(node: NodeInstance<string, string, unknown>): boolean;
