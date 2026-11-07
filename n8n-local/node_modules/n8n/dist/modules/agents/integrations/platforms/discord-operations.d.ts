import type { HttpRequestClient } from '@n8n/backend-network';
import { z } from 'zod';
export declare function downloadDiscordAttachment(attachmentUrl: string, httpClient: HttpRequestClient): Promise<Buffer>;
export declare const discordSearchChannelsSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodDefault<z.ZodNumber>;
    cursor: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    cursor?: string | undefined;
}, {
    query: string;
    limit?: number | undefined;
    cursor?: string | undefined;
}>;
export type DiscordSearchChannelsInput = z.infer<typeof discordSearchChannelsSchema>;
export interface DiscordChannelSearchResult {
    channelId: string;
    name: string;
    guildId: string;
    guildName: string;
}
export declare function searchDiscordChannels(params: {
    httpClient: HttpRequestClient;
    apiUrl: string;
    botToken: string;
    input: DiscordSearchChannelsInput;
}): Promise<unknown>;
export declare function executeDiscordContextQuery(params: {
    httpClient: HttpRequestClient;
    apiUrl: string;
    botToken: string | undefined;
    query: string;
    input: Record<string, unknown>;
}): Promise<unknown>;
export declare function resolveDiscordMessageTargetChannelId(threadId: string): string;
export declare function settleDiscordActionMessage(params: {
    httpClient: HttpRequestClient;
    apiUrl: string;
    botToken: string;
    threadId: string;
    messageId: string;
    content: string;
}): Promise<void>;
export interface DiscordApplicationMetadata {
    id: string;
    verify_key: string;
}
export declare function fetchDiscordApplicationMetadata(params: {
    httpClient: HttpRequestClient;
    apiUrl: string;
    botToken: string;
}): Promise<{
    ok: true;
    application: DiscordApplicationMetadata;
} | {
    ok: false;
    kind: 'http';
    status: number;
} | {
    ok: false;
    kind: 'incomplete';
}>;
