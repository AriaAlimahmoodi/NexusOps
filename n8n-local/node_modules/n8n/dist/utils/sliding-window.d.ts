export interface SlidingWindowOptions {
    maxEvents: number;
    durationMs: number;
}
export declare class SlidingWindow {
    private maxEvents;
    private durationMs;
    private eventTimestamps;
    constructor(options: SlidingWindowOptions);
    addEvent(timestamp: number): void;
    getCount(): number;
    clear(): void;
}
