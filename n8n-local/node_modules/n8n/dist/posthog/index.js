"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostHogClient = void 0;
const api_types_1 = require("@n8n/api-types");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const constants_1 = require("../constants");
const POSTHOG_GROUP_TYPE_INSTANCE = 'company';
const FLAGS_CACHE_TTL_MS = 10 * 60 * 1000;
const SESSION_ID_MAX_LENGTH = 1000;
function sanitizeSessionId(value) {
    const sanitized = value?.replace(/[^\x20-\x7E]/g, '').trim();
    return sanitized ? sanitized.slice(0, SESSION_ID_MAX_LENGTH) : undefined;
}
let PostHogClient = class PostHogClient {
    constructor(instanceSettings, globalConfig) {
        this.instanceSettings = instanceSettings;
        this.globalConfig = globalConfig;
        this.flagsCache = new Map();
    }
    async init() {
        const { enabled, posthogConfig } = this.globalConfig.diagnostics;
        if (!enabled || this.globalConfig.instanceAi.evalInstance) {
            return;
        }
        const { PostHog } = await import('posthog-node');
        this.postHog = new PostHog(posthogConfig.apiKey, {
            host: posthogConfig.apiHost,
        });
    }
    setupExpressSessionContext(app) {
        const postHog = this.postHog;
        if (!postHog || this.globalConfig.deployment.type !== 'cloud')
            return;
        app.use((req, _res, next) => {
            const sessionId = sanitizeSessionId(req.get('x-posthog-session-id'));
            if (!sessionId)
                return next();
            postHog.withContext({ sessionId }, next);
        });
    }
    async stop() {
        if (this.postHog) {
            return await this.postHog.shutdown();
        }
    }
    track(payload) {
        if (!payload.userId || payload.userId === this.instanceSettings.instanceId)
            return;
        const instanceId = payload?.properties?.instance_id;
        this.postHog?.capture({
            event: payload.event,
            distinctId: payload.userId,
            properties: payload.properties,
            ...(typeof instanceId === 'string' && {
                groups: { [POSTHOG_GROUP_TYPE_INSTANCE]: instanceId },
            }),
        });
    }
    groupIdentify({ instanceId, distinctId, properties, }) {
        if (!instanceId || !distinctId)
            return;
        this.postHog?.capture({
            distinctId,
            event: '$groupidentify',
            properties: {
                $group_type: POSTHOG_GROUP_TYPE_INSTANCE,
                $group_key: instanceId,
                $group_set: properties,
            },
            groups: {
                [POSTHOG_GROUP_TYPE_INSTANCE]: instanceId,
            },
        });
    }
    identify({ distinctId, properties, }) {
        if (!distinctId)
            return;
        this.postHog?.identify({
            distinctId,
            properties: properties ?? undefined,
        });
    }
    async getFeatureFlags(user) {
        return (await this.getFeatureFlagsAndPayloads(user)).featureFlags;
    }
    async getFeatureFlagForInstance(flagName) {
        const { instanceId } = this.instanceSettings;
        let data = { featureFlags: {}, featureFlagPayloads: {} };
        try {
            data = await this.fetchFlagsFromPostHog({
                cacheKey: ['instance', instanceId, flagName].join('#'),
                distinctId: `${POSTHOG_GROUP_TYPE_INSTANCE}_${instanceId}`,
                options: {
                    flagKeys: [flagName],
                    groups: { [POSTHOG_GROUP_TYPE_INSTANCE]: instanceId },
                },
            });
        }
        catch {
        }
        return this.applyEnvOverrides(data).featureFlags[flagName];
    }
    async getFeatureFlagsAndPayloads(user) {
        let data = { featureFlags: {}, featureFlagPayloads: {} };
        try {
            const { instanceId } = this.instanceSettings;
            const distinctId = [instanceId, user.id].join('#');
            data = await this.fetchFlagsFromPostHog({
                cacheKey: distinctId,
                distinctId,
                options: {
                    personProperties: {
                        created_at_timestamp: user.createdAt.getTime().toString(),
                        instance_id: instanceId,
                        version_cli: constants_1.N8N_VERSION,
                    },
                    ...(instanceId && { groups: { [POSTHOG_GROUP_TYPE_INSTANCE]: instanceId } }),
                },
            });
        }
        catch {
        }
        const overridden = this.applyEnvOverrides(data);
        const credentialDescriptionsEnabled = (await this.getFeatureFlagForInstance(api_types_1.CREDENTIAL_DESCRIPTIONS_FLAG)) === true;
        return {
            ...overridden,
            featureFlags: {
                ...overridden.featureFlags,
                [api_types_1.CREDENTIAL_DESCRIPTIONS_FLAG]: credentialDescriptionsEnabled,
            },
        };
    }
    async fetchFlagsFromPostHog({ cacheKey, distinctId, options, }) {
        if (!this.postHog) {
            return { featureFlags: {}, featureFlagPayloads: {} };
        }
        const cached = this.flagsCache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached;
        }
        const evaluatedFlags = await this.postHog.evaluateFlags(distinctId, options);
        const data = this.resolveFeatureFlagData(evaluatedFlags);
        if (Object.keys(data.featureFlags).length > 0) {
            this.flagsCache.set(cacheKey, { ...data, expiresAt: Date.now() + FLAGS_CACHE_TTL_MS });
        }
        return data;
    }
    resolveFeatureFlagData(evaluatedFlags) {
        const featureFlags = {};
        const featureFlagPayloads = {};
        if (!evaluatedFlags || !Array.isArray(evaluatedFlags.keys)) {
            return { featureFlags, featureFlagPayloads };
        }
        for (const key of evaluatedFlags.keys) {
            try {
                featureFlags[key] = evaluatedFlags.getFlag(key);
                const payload = evaluatedFlags.getFlagPayload(key);
                if (payload !== undefined && payload !== null) {
                    featureFlagPayloads[key] = payload;
                }
            }
            catch { }
        }
        return { featureFlags, featureFlagPayloads };
    }
    applyEnvOverrides(data) {
        const overrides = { ...this.globalConfig.featureFlags.override };
        if (this.globalConfig.evaluation.collectionsEnabled) {
            overrides[api_types_1.EVAL_COLLECTIONS_FLAG] = true;
        }
        if (this.globalConfig.evaluation.configEvalsEnabled) {
            overrides[api_types_1.CONFIG_EVALUATIONS_FLAG] = api_types_1.CONFIG_EVALUATIONS_ENABLED_VARIANT;
        }
        if (this.globalConfig.evaluation.agentEvalsEnabled) {
            overrides[api_types_1.AGENT_EVALS_FLAG] = true;
        }
        if (this.globalConfig.instanceAi.canvasNodeContextEnabled) {
            overrides[api_types_1.CANVAS_NODE_CONTEXT_FLAG] = true;
        }
        if (this.globalConfig.instanceAi.nodeUsageEnabled) {
            overrides[api_types_1.INSTANCE_AI_NODE_USAGE_FLAG] = true;
        }
        if (this.globalConfig.instanceAi.folderExplorationEnabled) {
            overrides[api_types_1.INSTANCE_AI_FOLDER_EXPLORATION_FLAG] =
                api_types_1.INSTANCE_AI_FOLDER_EXPLORATION_ENABLED_VARIANT;
        }
        if (this.globalConfig.workflows.groupsWithTriggersEnabled) {
            overrides[api_types_1.GROUPS_WITH_TRIGGERS_FLAG] = true;
        }
        if (this.globalConfig.workflows.groupsWithManyBoundariesEnabled) {
            overrides[api_types_1.GROUPS_WITH_MANY_BOUNDARIES_FLAG] = true;
        }
        if (Object.keys(overrides).length === 0) {
            return {
                featureFlags: data.featureFlags,
                featureFlagPayloads: data.featureFlagPayloads,
            };
        }
        const featureFlags = { ...data.featureFlags };
        const featureFlagPayloads = { ...data.featureFlagPayloads };
        for (const [key, override] of Object.entries(overrides)) {
            const value = typeof override === 'object' ? override.value : override;
            const payload = typeof override === 'object' ? override.payload : undefined;
            featureFlags[key] = value;
            if (payload === undefined || payload === null) {
                delete featureFlagPayloads[key];
            }
            else {
                featureFlagPayloads[key] = payload;
            }
        }
        return { featureFlags, featureFlagPayloads };
    }
};
exports.PostHogClient = PostHogClient;
exports.PostHogClient = PostHogClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings, config_1.GlobalConfig])
], PostHogClient);
//# sourceMappingURL=index.js.map