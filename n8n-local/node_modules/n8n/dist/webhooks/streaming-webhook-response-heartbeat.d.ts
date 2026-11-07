export interface ResponseStream {
    readonly writableEnded: boolean;
    readonly destroyed?: boolean;
    write(chunk: string): void;
    end(): void;
    flush?: () => void;
    once(event: 'finish' | 'close', listener: () => void): void;
    off(event: 'finish' | 'close', listener: () => void): void;
}
export declare class StreamingWebhookResponseHeartbeat {
    private readonly stream;
    private stopped;
    private readonly timer;
    constructor(stream: ResponseStream);
    readonly stop: () => void;
}
