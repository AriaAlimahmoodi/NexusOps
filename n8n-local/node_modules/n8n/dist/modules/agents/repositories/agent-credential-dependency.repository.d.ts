import { BaseRepository, TransactionRunner } from '@n8n/db';
import { DataSource } from '@n8n/typeorm';
import { AgentCredentialDependency } from '../entities/agent-credential-dependency.entity';
export type AgentCredentialDependencyReference = Pick<AgentCredentialDependency, 'agentId' | 'credentialId'>;
export declare class AgentCredentialDependencyRepository extends BaseRepository<AgentCredentialDependency> {
    private readonly txRunner;
    constructor(dataSource: DataSource, txRunner: TransactionRunner);
    refreshForAgent(agentId: string): Promise<void>;
    removeForAgent(agentId: string): Promise<void>;
    findByCredentialIds(credentialIds: string[]): Promise<AgentCredentialDependencyReference[]>;
    private findExistingCredentialIds;
}
