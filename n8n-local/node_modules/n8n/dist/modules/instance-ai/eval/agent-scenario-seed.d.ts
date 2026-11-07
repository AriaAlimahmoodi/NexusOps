import type { InstanceAiEvalAgentScenarioSeed } from '@n8n/api-types';
export interface AgentSeedToolSummary {
    name: string;
    kind: 'node' | 'workflow' | 'custom' | 'mcp' | 'other';
    description?: string;
    nodeType?: string;
}
export interface GenerateAgentScenarioSeedOptions {
    agentName: string;
    instructions: string;
    tools: AgentSeedToolSummary[];
    scenarioHints?: string;
}
export declare function generateAgentScenarioSeed(options: GenerateAgentScenarioSeedOptions): Promise<InstanceAiEvalAgentScenarioSeed>;
