import type { InstanceAiPreferenceCardEditRequestDto, InstanceAiPreferenceCardEditResponse, InstanceAiPreferenceCardEvent, InstanceAiPreferenceCardUndoRequestDto } from '@n8n/api-types';
import type { User } from '@n8n/db';
import { AiPreferenceService } from '../../services/ai-preference.service';
import { Telemetry } from '../../telemetry';
import { InProcessEventBus } from './event-bus/in-process-event-bus';
export declare class InstanceAiPreferenceCardService {
    private readonly aiPreferenceService;
    private readonly eventBus;
    private readonly telemetry;
    constructor(aiPreferenceService: AiPreferenceService, eventBus: InProcessEventBus, telemetry: Telemetry);
    undo(user: User, threadId: string, preferenceId: string, { runId, toolCallId }: InstanceAiPreferenceCardUndoRequestDto): Promise<InstanceAiPreferenceCardEvent>;
    edit(user: User, threadId: string, preferenceId: string, { runId, toolCallId, content, scope, projectId, userId, }: InstanceAiPreferenceCardEditRequestDto): Promise<InstanceAiPreferenceCardEditResponse>;
    private publish;
}
