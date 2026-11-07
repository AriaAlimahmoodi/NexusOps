import type { TypedEmitter } from '@n8n/backend-common';
export type SlidingWindowSignalOpts = {
    windowSizeInMs?: number;
};
export declare class SlidingWindowSignal<TEvents, TEventName extends keyof TEvents & string> {
    private readonly eventEmitter;
    private readonly eventName;
    private lastSignal;
    private lastSignalTime;
    private windowSizeInMs;
    constructor(eventEmitter: TypedEmitter<TEvents>, eventName: TEventName, opts?: SlidingWindowSignalOpts);
    getSignal(): Promise<TEvents[TEventName] | null>;
}
