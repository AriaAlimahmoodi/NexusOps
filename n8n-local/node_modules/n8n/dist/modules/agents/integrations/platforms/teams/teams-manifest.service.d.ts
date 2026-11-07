import { type AgentTeamsIntegrationSettings, type TeamsAgentAppManifest } from '@n8n/api-types';
import type { TeamsAppIcons } from './teams-app-icons';
export interface BuildTeamsManifestOptions {
    agentName: string;
    agentId: string;
    botId: string;
    versionAt: Date;
    settings?: AgentTeamsIntegrationSettings;
    icons?: TeamsAppIcons;
}
export declare const READ_PERMISSIONS: readonly [{
    readonly setting: 'readAllChannelMessages';
    readonly requires: 'teamChannels';
    readonly name: 'ChannelMessage.Read.Group';
    readonly conversationType: 'channel';
}, {
    readonly setting: 'readAllGroupMessages';
    readonly requires: 'groupChats';
    readonly name: 'ChatMessage.Read.Chat';
    readonly conversationType: 'groupChat';
}];
export declare class TeamsManifestService {
    buildManifest(options: BuildTeamsManifestOptions): TeamsAgentAppManifest;
    fingerprint(manifest: TeamsAgentAppManifest, icon?: unknown): string;
    buildPackage(options: BuildTeamsManifestOptions): Promise<Buffer>;
    private buildScopes;
    private buildReadPermissions;
    defaultIdentity(agentName: string): {
        displayName: string;
        description: string;
    };
    buildManifestId(agentId: string): string;
    private buildVersion;
    private truncate;
}
