import type { Schedule } from '@n8n/scheduler';
export declare class SystemTaskTimer {
    private readonly schedule;
    private readonly onFire;
    private readonly onPlanError;
    private readonly onPlan;
    private readonly now;
    private timer;
    constructor(schedule: Schedule, onFire: (lagMs: number, coalesced: number) => void, onPlanError: (error: Error) => void, onPlan: (fireAt: Date) => void, now?: () => number);
    start(from: Date): void;
    stop(): void;
    private arm;
    private nextOccurrence;
    private countOccurrencesUpTo;
    private waitFor;
}
