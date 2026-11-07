"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLACK_BOT_SCOPES = exports.SLACK_CREDENTIAL_TYPE = exports.SLACK_APP_SETUP_TTL_MS = void 0;
exports.hasSessionShape = hasSessionShape;
exports.slackSetupCacheKey = slackSetupCacheKey;
exports.managedSlackAppCacheKey = managedSlackAppCacheKey;
exports.childRecord = childRecord;
exports.parseSlackAppSetupResponse = parseSlackAppSetupResponse;
const is_record_1 = require("@n8n/utils/is-record");
const errors_1 = require("@n8n/errors");
const integration_helpers_1 = require("../../integration-helpers");
const SLACK_APP_SETUP_CACHE_PREFIX = 'agents:slack-app-setup:';
const SLACK_MANAGED_APP_CACHE_PREFIX = 'agents:slack-managed-app:';
exports.SLACK_APP_SETUP_TTL_MS = 60 * 60 * 1000;
exports.SLACK_CREDENTIAL_TYPE = 'slackApi';
exports.SLACK_BOT_SCOPES = [
    'app_mentions:read',
    'assistant:write',
    'channels:history',
    'channels:join',
    'channels:read',
    'chat:write',
    'files:read',
    'files:write',
    'groups:history',
    'groups:read',
    'im:history',
    'im:read',
    'im:write',
    'mpim:history',
    'mpim:read',
    'mpim:write',
    'reactions:write',
    'users:read',
    'users:read.email',
];
function hasSessionShape(value) {
    const keys = [
        'projectId',
        'agentId',
        'userId',
        'appId',
        'clientId',
        'clientSecret',
        'signingSecret',
        'redirectUrl',
    ];
    return (0, is_record_1.isRecord)(value) && keys.every((key) => typeof value[key] === 'string');
}
function slackSetupCacheKey(state) {
    return `${SLACK_APP_SETUP_CACHE_PREFIX}${state}`;
}
function managedSlackAppCacheKey(options) {
    return `${SLACK_MANAGED_APP_CACHE_PREFIX}${options.projectId}:${options.agentId}:${options.managerCredentialId}:${options.workspaceId}:${options.userId}`;
}
function childRecord(record, key) {
    const child = record[key];
    return (0, is_record_1.isRecord)(child) ? child : undefined;
}
function parseSlackAppSetupResponse(response) {
    const credentials = childRecord(response, 'credentials');
    const appId = (0, integration_helpers_1.stringProperty)(response, 'app_id');
    const clientId = (0, integration_helpers_1.stringProperty)(credentials, 'client_id');
    const clientSecret = (0, integration_helpers_1.stringProperty)(credentials, 'client_secret');
    const signingSecret = (0, integration_helpers_1.stringProperty)(credentials, 'signing_secret');
    const oauthAuthorizeUrl = (0, integration_helpers_1.stringProperty)(response, 'oauth_authorize_url');
    if (!appId || !clientId || !clientSecret || !signingSecret || !oauthAuthorizeUrl) {
        throw new errors_1.BadRequestError('Slack returned an incomplete app setup response');
    }
    return { appId, clientId, clientSecret, signingSecret, oauthAuthorizeUrl };
}
//# sourceMappingURL=slack-setup.types.js.map