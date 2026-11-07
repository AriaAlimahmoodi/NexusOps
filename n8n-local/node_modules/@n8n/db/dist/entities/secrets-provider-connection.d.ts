import { WithTimestamps } from './abstract-entity';
import type { ProjectSecretsProviderAccess } from './project-secrets-provider-access';
export declare class SecretsProviderConnection extends WithTimestamps {
    id: number;
    providerKey: string;
    type: string;
    projectAccess: ProjectSecretsProviderAccess[];
    encryptedSettings: string;
    isEnabled: boolean;
}
