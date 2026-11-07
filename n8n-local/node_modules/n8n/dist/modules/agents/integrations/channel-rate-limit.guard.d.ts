export declare class ChannelRateLimitGuard {
    private readonly blockedUntilMs;
    isBlocked(connectionId: string, nowMs?: number): boolean;
    record(connectionId: string, nowMs?: number): void;
}
