import type { AiPreferenceDto, AiPreferenceScope, AiPreferenceSource } from '@n8n/api-types';
import type { Logger } from '@n8n/backend-common';
import type { User } from '@n8n/db';
import { ResponseError } from '@n8n/errors';
import type { AiPreferenceService } from '../services/ai-preference.service';
import type { Telemetry } from '../telemetry';
export type AiPreferenceWriteRejection = 'too_long' | 'scope_full' | 'duplicate' | 'not_permitted' | 'blocked_by_admin' | 'failed';
export type AiPreferenceWriteRefusal = {
    reason: 'too_long' | 'scope_full';
    message: string;
    limit: number;
    actual: number;
} | {
    reason: Exclude<AiPreferenceWriteRejection, 'too_long' | 'scope_full'>;
    message: string;
};
export type AiPreferenceWriteResult = {
    ok: true;
    preference: AiPreferenceDto;
} | ({
    ok: false;
} & AiPreferenceWriteRefusal);
export type AssistantSurface = Exclude<AiPreferenceSource, 'ui'>;
export declare function toAiPreferenceWriteRejection(error: unknown): AiPreferenceWriteRefusal;
export declare function isExpectedAiPreferenceRefusal(error: unknown): error is ResponseError;
export declare function secondsSinceSaved(preference: AiPreferenceDto, now?: number): number;
export type AssistantPreferenceWrite = {
    aiPreferenceService: AiPreferenceService;
    telemetry: Telemetry;
    logger: Logger;
    user: User;
    surface: AssistantSurface;
    content: string;
    scope: AiPreferenceScope;
};
export declare function writeAssistantPreference({ aiPreferenceService, telemetry, logger, user, surface, content, scope, }: AssistantPreferenceWrite): Promise<AiPreferenceWriteResult>;
