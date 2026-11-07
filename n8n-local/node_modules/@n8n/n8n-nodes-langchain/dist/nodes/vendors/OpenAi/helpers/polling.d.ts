import type { IExecuteFunctions } from 'n8n-workflow';
export declare function pollUntilAvailable<TResponse>(ctx: IExecuteFunctions, request: () => Promise<TResponse>, check: (response: TResponse) => boolean, timeoutSeconds: number, intervalSeconds?: number): Promise<TResponse>;
