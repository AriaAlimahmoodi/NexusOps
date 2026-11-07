import { Logger } from '@n8n/backend-common';
import { EventService } from '@n8n/backend-services';
import { GlobalConfig } from '@n8n/config';
import { SettingsRepository } from '@n8n/db';
import { TELEMETRY_EVENT, type InferTelemetryProps } from '@n8n/telemetry';
import { InstanceCredentialBroker } from '../../credentials/instance-credential-broker';
import { Telemetry } from '../../telemetry';
import { InstanceAiSettingsService, type AdminCredentialSelection } from './instance-ai-settings.service';
type SetupSnapshot = InferTelemetryProps<typeof TELEMETRY_EVENT.INSTANCE_AI.AI_ASSISTANT_SETUP_COMPLETED>;
export declare class InstanceAiSetupTelemetryService {
    private readonly logger;
    private readonly telemetry;
    private readonly settingsRepository;
    private readonly instanceCredentialBroker;
    private readonly settingsService;
    private readonly config;
    private readonly deploymentConfig;
    private setupCompletionRecorded;
    constructor(logger: Logger, globalConfig: GlobalConfig, eventService: EventService, telemetry: Telemetry, settingsRepository: SettingsRepository, instanceCredentialBroker: InstanceCredentialBroker, settingsService: InstanceAiSettingsService);
    private isDirectSelfManaged;
    private providerForCredential;
    private modelProviderForCredential;
    private searchProviderForCredential;
    private sandboxTypeOf;
    private modelSnapshot;
    private searchSnapshot;
    buildSetupSnapshot(): Promise<SetupSnapshot>;
    private emitModelConfigured;
    private emitSandboxConfigured;
    private emitSearchConfigured;
    reportSetupChanges(previous: AdminCredentialSelection, next: AdminCredentialSelection, connectionsUpdated?: {
        model: boolean;
        sandbox: boolean;
        search: boolean;
    }): Promise<void>;
    recordSetupCompletedIfNeeded(): Promise<void>;
}
export {};
