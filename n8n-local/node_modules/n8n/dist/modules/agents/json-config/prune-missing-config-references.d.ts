import type { AgentJsonConfig } from '@n8n/api-types';
import type { AgentDefinition } from '../utils/agent-definition';
export declare function pruneMissingConfigReferences(config: AgentJsonConfig, previousSchema: AgentJsonConfig | null, available: Pick<AgentDefinition, 'tools'> & {
    taskIds: ReadonlySet<string>;
}): void;
