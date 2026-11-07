export declare function discoverStructuredOutputSchema(body: unknown): Record<string, unknown> | undefined;
export declare function conformContentToSchema(content: string, schema: Record<string, unknown> | undefined): string;
export declare function applyStructuredOutputConformance(content: string, body: unknown): string;
