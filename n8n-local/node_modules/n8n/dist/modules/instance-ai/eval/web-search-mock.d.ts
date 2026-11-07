import type { Logger } from '@n8n/backend-common';
export interface WebSearchMockArgs {
    query: string;
    maxResults?: number;
    includeDomains?: string[];
    excludeDomains?: string[];
}
export interface WebSearchMockResult {
    query: string;
    results: Array<{
        title: string;
        url: string;
        snippet: string;
        publishedDate?: string;
    }>;
    note?: string;
}
export interface WebSearchMockOptions {
    agentInstructions: string;
    scenarioHints?: string;
    globalContext?: string;
    searchHint?: string;
    onSearch: (args: WebSearchMockArgs, result: WebSearchMockResult) => void;
    logger: Logger;
}
export declare function createWebSearchMock(options: WebSearchMockOptions): (args: WebSearchMockArgs) => Promise<WebSearchMockResult>;
