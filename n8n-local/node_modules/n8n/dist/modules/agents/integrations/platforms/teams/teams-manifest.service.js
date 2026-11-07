"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamsManifestService = exports.READ_PERMISSIONS = void 0;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const fflate_1 = require("fflate");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_path_1 = require("node:path");
const uuid_1 = require("uuid");
const integration_helpers_1 = require("../../integration-helpers");
const MANIFEST_VERSION = '1.16';
const MANIFEST_SCHEMA = `https://developer.microsoft.com/json-schemas/teams/v${MANIFEST_VERSION}/MicrosoftTeams.schema.json`;
const ACCENT_COLOR = '#EA4B71';
const DEFAULT_APP_NAME = 'n8n Agent';
const MANIFEST_ID_NAMESPACE = 'b6b3f2a4-1c5e-4d9a-9f3b-7e2c8a1d4f60';
const LIMITS = {
    shortName: api_types_1.TEAMS_DISPLAY_NAME_MAX,
    shortDescription: api_types_1.TEAMS_DESCRIPTION_MAX,
    fullName: 100,
    fullDescription: 4000,
    developerName: 32,
};
const RSC_RESOURCE = 'https://RscBasedStoreApp';
exports.READ_PERMISSIONS = [
    {
        setting: 'readAllChannelMessages',
        requires: 'teamChannels',
        name: 'ChannelMessage.Read.Group',
        conversationType: 'channel',
    },
    {
        setting: 'readAllGroupMessages',
        requires: 'groupChats',
        name: 'ChatMessage.Read.Chat',
        conversationType: 'groupChat',
    },
];
function describeApp(appName) {
    return `Chat with ${appName}, an agent powered by n8n.`;
}
let TeamsManifestService = class TeamsManifestService {
    buildManifest(options) {
        const appName = (0, integration_helpers_1.sanitiseAppName)(options.settings?.displayName ?? options.agentName, LIMITS.fullName, DEFAULT_APP_NAME);
        const shortDescription = options.settings?.description ?? describeApp(appName);
        return {
            $schema: MANIFEST_SCHEMA,
            manifestVersion: MANIFEST_VERSION,
            version: this.buildVersion(options.versionAt),
            id: this.buildManifestId(options.agentId),
            packageName: `io.n8n.agent.${this.buildManifestId(options.agentId)}`,
            developer: {
                name: this.truncate('n8n', LIMITS.developerName),
                websiteUrl: 'https://n8n.io',
                privacyUrl: 'https://n8n.io/legal/privacy',
                termsOfUseUrl: 'https://n8n.io/legal/',
            },
            name: {
                short: this.truncate(appName, LIMITS.shortName),
                full: this.truncate(appName, LIMITS.fullName),
            },
            description: {
                short: this.truncate(shortDescription, LIMITS.shortDescription),
                full: this.truncate(shortDescription, LIMITS.fullDescription),
            },
            icons: {
                color: 'color.png',
                outline: 'outline.png',
            },
            accentColor: options.icons?.accentColor ?? ACCENT_COLOR,
            bots: [
                {
                    botId: options.botId,
                    scopes: this.buildScopes(options.settings),
                    isNotificationOnly: false,
                    supportsFiles: true,
                },
            ],
            permissions: ['identity', 'messageTeamMembers'],
            validDomains: [],
            ...this.buildReadPermissions(options.botId, options.settings),
        };
    }
    fingerprint(manifest, icon) {
        const { version: _version, ...content } = manifest;
        return (0, node_crypto_1.createHash)('sha256')
            .update(JSON.stringify({ content, icon: icon ?? null }))
            .digest('hex');
    }
    async buildPackage(options) {
        const manifest = this.buildManifest(options);
        const [color, outline] = options.icons
            ? [options.icons.color, options.icons.outline]
            : await Promise.all([
                (0, promises_1.readFile)((0, node_path_1.join)(__dirname, 'assets', 'color.png')),
                (0, promises_1.readFile)((0, node_path_1.join)(__dirname, 'assets', 'outline.png')),
            ]);
        return Buffer.from((0, fflate_1.zipSync)({
            'manifest.json': Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'),
            'color.png': color,
            'outline.png': outline,
        }));
    }
    buildScopes(availability) {
        return [
            'personal',
            ...(availability?.teamChannels ? ['team'] : []),
            ...(availability?.groupChats ? ['groupChat'] : []),
        ];
    }
    buildReadPermissions(botId, availability) {
        const resourceSpecific = exports.READ_PERMISSIONS.filter(({ requires }) => availability?.[requires]).map(({ name }) => ({ name, type: 'Application' }));
        if (resourceSpecific.length === 0)
            return {};
        return {
            webApplicationInfo: { id: botId, resource: RSC_RESOURCE },
            authorization: { permissions: { resourceSpecific } },
        };
    }
    defaultIdentity(agentName) {
        const appName = (0, integration_helpers_1.sanitiseAppName)(agentName, LIMITS.fullName, DEFAULT_APP_NAME);
        return {
            displayName: this.truncate(appName, LIMITS.shortName),
            description: this.truncate(describeApp(appName), LIMITS.shortDescription),
        };
    }
    buildManifestId(agentId) {
        return (0, uuid_1.v5)(agentId, MANIFEST_ID_NAMESPACE);
    }
    buildVersion(updatedAt) {
        const millis = Math.max(0, updatedAt.getTime());
        const days = Math.floor(millis / 86_400_000);
        const millisIntoDay = millis % 86_400_000;
        return `1.${days}.${millisIntoDay}`;
    }
    truncate(value, max) {
        return (0, integration_helpers_1.truncateToCodePoints)(value, max);
    }
};
exports.TeamsManifestService = TeamsManifestService;
exports.TeamsManifestService = TeamsManifestService = __decorate([
    (0, di_1.Service)()
], TeamsManifestService);
//# sourceMappingURL=teams-manifest.service.js.map