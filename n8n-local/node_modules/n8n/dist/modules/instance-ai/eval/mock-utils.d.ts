import type { FetchFn } from '@n8n/agents';
import type { Logger } from '@n8n/backend-common';
export declare function generateJson<T>(agentName: string, instructions: string, userPrompt: string, validate: (parsed: unknown) => T | undefined, logger: Logger): Promise<T | undefined>;
export declare function resolveUrl(input: Parameters<FetchFn>[0]): string;
