import type { FetchedPage } from '@n8n/instance-ai';
type GenerateFn = (prompt: string) => Promise<string>;
export declare function maybeSummarize(page: FetchedPage, generateFn?: GenerateFn): Promise<FetchedPage>;
export {};
