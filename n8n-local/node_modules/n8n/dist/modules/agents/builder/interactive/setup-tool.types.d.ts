import type { InstanceAiCredentialService } from '@n8n/instance-ai';
import type { BuilderTrackFn } from '../builder-config-telemetry';
interface SetupToolDeps {
    projectId: string;
    track: BuilderTrackFn;
}
export interface CredentialSetupDeps extends SetupToolDeps {
    credentialService: InstanceAiCredentialService;
    isCredentialTypeKnown?: (credentialType: string) => boolean;
    listIntegrationCredentialIds?: () => Promise<string[]>;
}
export interface ChannelSetupDeps extends SetupToolDeps {
    agentId: string;
    listChatIntegrationTypes: () => Promise<string[]>;
}
export {};
