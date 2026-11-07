import type { Logger } from '@n8n/backend-common';
type EvalTimingPhase = 'hints' | 'bypass-pin' | 'http-mock' | 'ai-turn';
export declare class EvalTimings {
    private readonly samples;
    private readonly startedAt;
    readonly enabled: boolean;
    time<T>(phase: EvalTimingPhase, label: string | undefined, fn: () => Promise<T>): Promise<T>;
    summary(logger: Logger): void;
}
export {};
