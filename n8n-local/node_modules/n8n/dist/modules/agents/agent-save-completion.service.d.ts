import { EventService } from '@n8n/backend-services';
import { AgentModificationTelemetryService, type AgentModificationEvent } from './agent-modification-telemetry.service';
import { AgentUpdateBroadcaster } from './agent-update-broadcaster';
export declare class AgentSaveCompletionService {
    private readonly eventService;
    private readonly broadcaster;
    private readonly modificationTelemetry;
    constructor(eventService: EventService, broadcaster: AgentUpdateBroadcaster, modificationTelemetry: AgentModificationTelemetryService);
    configurationSaved(event: AgentModificationEvent, pushRef: string | undefined, emitSetupCompleted: (() => Promise<void>) | null): Promise<void>;
    bodySaved(event: AgentModificationEvent, pushRef?: string, recordTelemetry?: boolean): Promise<void>;
    taskSaved(event: AgentModificationEvent, pushRef?: string): void;
    private notify;
    private clearRuntimes;
}
