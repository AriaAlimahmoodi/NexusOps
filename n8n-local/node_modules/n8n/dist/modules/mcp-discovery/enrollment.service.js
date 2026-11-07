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
exports.McpDiscoveryEnrollmentService = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const oauth_user_consent_repository_1 = require("../../modules/oauth-server/database/repositories/oauth-user-consent.repository");
const activity_service_1 = require("./activity.service");
const activity_events_service_1 = require("./activity-events.service");
const eligibility_1 = require("./eligibility");
let McpDiscoveryEnrollmentService = class McpDiscoveryEnrollmentService {
    constructor(settings, config, consents, apiKeys, activityEvents) {
        this.settings = settings;
        this.config = config;
        this.consents = consents;
        this.apiKeys = apiKeys;
        this.activityEvents = activityEvents;
    }
    async visit(user, { pickedClaude, isTrial } = {}) {
        const inactive = { status: 'inactive' };
        if (this.config.deployment.type !== 'cloud')
            return inactive;
        if (user.role.slug !== 'global:owner')
            return inactive;
        const userId = user.id;
        await this.activityEvents.flush(userId);
        const unknown = { status: 'unknown' };
        const savedEligibility = await this.readEligibilityTime(userId);
        if (savedEligibility !== undefined) {
            return {
                status: 'assigned',
                eligibleAt: savedEligibility,
                ...(await this.getMcpState(userId)),
            };
        }
        if (isTrial === undefined)
            return unknown;
        if (!isTrial)
            return { status: 'excluded' };
        const now = Date.now();
        const [firstVisit, mutation] = await Promise.all([
            this.settings.findByKey((0, activity_service_1.discoveryUserKey)(userId, 'firstLoginAt')),
            this.settings.findByKey((0, activity_service_1.discoveryUserKey)(userId, 'assistantMutationAt')),
        ]);
        const eligibility = (0, eligibility_1.evaluateMcpDiscoveryEligibility)({
            pickedClaude,
            now,
            isTrial,
            firstLoginAt: this.parseTimestamp(firstVisit?.value),
            assistantMutationAt: mutation ? this.parseTimestamp(mutation.value) : null,
        });
        if (eligibility.status !== 'eligible')
            return eligibility;
        await this.settings.claimKey((0, activity_service_1.discoveryUserKey)(userId, 'eligibleAt'), String(eligibility.eligibleAt));
        return {
            status: 'assigned',
            eligibleAt: eligibility.eligibleAt,
            ...(await this.getMcpState(userId)),
        };
    }
    async getMcpState(userId) {
        const [connected, keys, used] = await Promise.all([
            this.consents.findConnectedClients({ userId, now: Date.now() }),
            this.apiKeys.find({ where: { userId, audience: 'mcp-server-api' }, select: ['id'] }),
            this.settings.findByKey((0, activity_service_1.discoveryUserKey)(userId, 'claudeMcpUsedAt')),
        ]);
        const observed = await Promise.all([
            ...connected.rows.map(async ({ clientId }) => await this.settings.findByKey((0, activity_service_1.discoveryUserKey)(userId, `claudeClient.${clientId}`))),
            ...keys.map(async ({ id }) => await this.settings.findByKey((0, activity_service_1.discoveryUserKey)(userId, `claudeApiKey.${id}`))),
        ]);
        const hasConnectedClaude = observed.some((row) => Boolean(row?.value)) ||
            connected.rows.some(({ client }) => (0, activity_service_1.isClaudeMcpClient)(client.name));
        return {
            hasConnectedClaude,
            hasUsedMcp: this.parseTimestamp(used?.value) !== undefined,
        };
    }
    async readEligibilityTime(userId) {
        const row = await this.settings.findByKey((0, activity_service_1.discoveryUserKey)(userId, 'eligibleAt'));
        return this.parseTimestamp(row?.value);
    }
    parseTimestamp(value) {
        return value && Number.isFinite(Number(value)) ? Number(value) : undefined;
    }
};
exports.McpDiscoveryEnrollmentService = McpDiscoveryEnrollmentService;
exports.McpDiscoveryEnrollmentService = McpDiscoveryEnrollmentService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.SettingsRepository, config_1.GlobalConfig, oauth_user_consent_repository_1.UserConsentRepository, db_1.ApiKeyRepository, activity_events_service_1.McpDiscoveryActivityEvents])
], McpDiscoveryEnrollmentService);
//# sourceMappingURL=enrollment.service.js.map