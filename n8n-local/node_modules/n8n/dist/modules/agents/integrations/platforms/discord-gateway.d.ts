import type { Logger } from '@n8n/backend-common';
import type { InstanceSettings } from 'n8n-core';
export interface DiscordGatewayAdapter {
    startGatewayListener(options: {
        waitUntil?: (task: Promise<unknown>) => void;
    }, durationMs?: number, abortSignal?: AbortSignal, webhookUrl?: string): Promise<{
        ok: boolean;
        text: () => Promise<string>;
    }>;
}
export interface DiscordConnection {
    adapter: DiscordGatewayAdapter;
    botToken: string;
    ingressEnabled: boolean;
}
export declare class DiscordGateway {
    private readonly logger;
    private readonly instanceSettings;
    private readonly sessions;
    private sweep;
    constructor(logger: Logger, instanceSettings: InstanceSettings);
    register(key: string, connection: DiscordConnection): void;
    discard(key: string): Promise<void>;
    startAll(): void;
    pauseAll(): Promise<void>;
    botTokenFor(key: string): string | undefined;
    sessionKeyUsingBotToken(botToken: string, excludeKey?: string): string | undefined;
    private pause;
    private drain;
    private start;
    private runLoop;
}
