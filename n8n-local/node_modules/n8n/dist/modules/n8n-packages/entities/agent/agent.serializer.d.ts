import type { Agent } from '../../../../modules/agents/entities/agent.entity';
import type { AgentDefinition } from '../../../../modules/agents/utils/agent-definition';
import { type SerializedAgent, type SerializedAgentMetadata } from '../../spec/serialized/agent.schema';
export declare class AgentSerializer {
    serialize(agent: Pick<Agent, 'id' | 'name' | 'availableInMCP'>, definition: AgentDefinition, integrations: Agent['integrations']): SerializedAgent;
    serializeMetadata(source: Pick<Agent, 'versionId' | 'activeVersionId'>): SerializedAgentMetadata;
    private referencedBodies;
}
