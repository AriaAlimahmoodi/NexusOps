export declare const SLACK_APP_SETUP_TTL_MS: number;
export declare const SLACK_CREDENTIAL_TYPE = "slackApi";
export declare const SLACK_BOT_SCOPES: readonly ['app_mentions:read', 'assistant:write', 'channels:history', 'channels:join', 'channels:read', 'chat:write', 'files:read', 'files:write', 'groups:history', 'groups:read', 'im:history', 'im:read', 'im:write', 'mpim:history', 'mpim:read', 'mpim:write', 'reactions:write', 'users:read', 'users:read.email'];
export interface SlackAppSetupSession {
    projectId: string;
    agentId: string;
    userId: string;
    appId: string;
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    redirectUrl: string;
    managerCredentialId?: string;
    teamId?: string;
    teamName?: string;
}
export declare function hasSessionShape(value: unknown): value is SlackAppSetupSession;
export declare function slackSetupCacheKey(state: string): string;
export declare function managedSlackAppCacheKey(options: {
    projectId: string;
    agentId: string;
    managerCredentialId: string;
    workspaceId: string;
    userId: string;
}): string;
export declare function childRecord(record: Record<string, unknown>, key: string): Record<string, unknown> | undefined;
export declare function parseSlackAppSetupResponse(response: Record<string, unknown>): {
    appId: string;
    clientId: string;
    clientSecret: string;
    signingSecret: string;
    oauthAuthorizeUrl: string;
};
