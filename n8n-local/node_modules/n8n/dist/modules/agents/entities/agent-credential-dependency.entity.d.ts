import { type CredentialsEntity, WithCreatedAt } from '@n8n/db';
import { type Relation } from '@n8n/typeorm';
import type { Agent } from './agent.entity';
export declare class AgentCredentialDependency extends WithCreatedAt {
    agentId: string;
    agent: Relation<Agent>;
    credentialId: string;
    credential: Relation<CredentialsEntity>;
}
