import { WithTimestamps } from './abstract-entity';
import { Project } from './project';
import { SecretsProviderConnection } from './secrets-provider-connection';
export type SecretsProviderAccessRole = 'secretsProviderConnection:owner' | 'secretsProviderConnection:user';
export declare class ProjectSecretsProviderAccess extends WithTimestamps {
    secretsProviderConnection: SecretsProviderConnection;
    secretsProviderConnectionId: number;
    project: Project;
    projectId: string;
    role: SecretsProviderAccessRole;
}
