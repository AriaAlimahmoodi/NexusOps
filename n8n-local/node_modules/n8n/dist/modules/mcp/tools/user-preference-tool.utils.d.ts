import type { AiPreferenceDto, AiPreferenceScope } from '@n8n/api-types';
import type { InferTelemetryProps, TELEMETRY_EVENT } from '@n8n/telemetry';
import z from 'zod';
import type { AiPreferenceWriteRejection } from '../../../services/ai-preference-write';
import { secondsSinceSaved } from '../../../services/ai-preference-write';
import type { UrlService } from '@n8n/backend-services';
export type PreferenceWriteReason = AiPreferenceWriteRejection | 'not_found';
export declare const PREFERENCE_WRITE_REASONS: readonly ["too_long", "scope_full", "duplicate", "not_permitted", "blocked_by_admin", "failed", "not_found"];
export declare function classifyPreferenceWriteError(error: unknown): {
    reason: PreferenceWriteReason;
    message: string;
};
type RejectedReason = InferTelemetryProps<typeof TELEMETRY_EVENT.CONTEXT.PREFERENCE_WRITE_REJECTED>['reason'];
export declare function toRejectedReason(reason: PreferenceWriteReason): RejectedReason;
export declare const savedPreferenceSchema: z.ZodObject<{
    id: z.ZodString;
    scope: z.ZodEnum<["user", "project", "instance"]>;
    text: z.ZodString;
    url: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    scope: "instance" | "project" | "user";
    text: string;
    url: string;
}, {
    id: string;
    scope: "instance" | "project" | "user";
    text: string;
    url: string;
}>;
export type SavedPreferenceOutput = z.infer<typeof savedPreferenceSchema>;
export declare function preferencesSettingsUrl(urlService: UrlService): string;
export declare function toSavedPreferenceOutput(preference: AiPreferenceDto, url: string): SavedPreferenceOutput;
export declare function preferenceScopeOf(preference: AiPreferenceDto): AiPreferenceScope;
export { secondsSinceSaved };
