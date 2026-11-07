import type { AgentJsonToolConfig } from '@n8n/api-types';
export interface HttpRequestToolUrlFromAiViolation {
    toolIndex: number;
    toolName: string;
    path: `tools.${number}.node.nodeParameters.url`;
}
export declare function findHttpRequestToolUrlFromAiViolations(tools: AgentJsonToolConfig[] | undefined): HttpRequestToolUrlFromAiViolation[];
export declare function validateNodeToolExpressions(tools: AgentJsonToolConfig[] | undefined): void;
export declare function validateNodeToolConfigs(tools: AgentJsonToolConfig[] | undefined): Promise<string | null>;
