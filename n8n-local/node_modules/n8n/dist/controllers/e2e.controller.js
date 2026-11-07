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
var E2EController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.E2EController = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const uuid_1 = require("uuid");
const active_workflow_manager_1 = require("../active-workflow-manager");
const constants_2 = require("../constants");
const license_1 = require("../license");
const mfa_service_1 = require("../mfa/mfa.service");
const log_streaming_destination_service_1 = require("../modules/log-streaming.ee/log-streaming-destination.service");
const push_1 = require("../push");
const workflow_scheduled_job_owner_1 = require("../scheduling/workflow-scheduled-job-owner");
const backend_services_1 = require("@n8n/backend-services");
const frontend_service_1 = require("../services/frontend.service");
const heap_diagnostics_service_1 = require("../services/heap-diagnostics.service");
const password_utility_1 = require("../services/password.utility");
const process_internals_service_1 = require("../services/process-internals.service");
const workflow_static_data_service_1 = require("../workflows/workflow-static-data.service");
if (!constants_2.inE2ETests) {
    di_1.Container.get(backend_common_1.Logger).error('E2E endpoints only allowed during E2E tests');
    process.exit(1);
}
const tablesToTruncate = [
    'auth_identity',
    'auth_provider_sync_history',
    'credentials_entity',
    'event_destinations',
    'execution_entity',
    'installed_nodes',
    'installed_packages',
    'poller_state',
    'project',
    'project_relation',
    'role',
    'settings',
    'shared_credentials',
    'shared_workflow',
    'tag_entity',
    'user',
    'variables',
    'webhook_entity',
    'workflow_entity',
    'workflow_statistics',
    'workflows_tags',
];
let E2EController = E2EController_1 = class E2EController {
    constructor(license, settingsRepo, workflowRunner, mfaService, cacheService, push, passwordUtility, userRepository, frontendService, executionsConfig, logStreamingDestinationsService, scheduledJobRepository, workflowScheduledJobOwner, pollerStateRepository, workflowStaticDataService, processInternalsService, heapDiagnosticsService) {
        this.settingsRepo = settingsRepo;
        this.workflowRunner = workflowRunner;
        this.mfaService = mfaService;
        this.cacheService = cacheService;
        this.push = push;
        this.passwordUtility = passwordUtility;
        this.userRepository = userRepository;
        this.frontendService = frontendService;
        this.executionsConfig = executionsConfig;
        this.logStreamingDestinationsService = logStreamingDestinationsService;
        this.scheduledJobRepository = scheduledJobRepository;
        this.workflowScheduledJobOwner = workflowScheduledJobOwner;
        this.pollerStateRepository = pollerStateRepository;
        this.workflowStaticDataService = workflowStaticDataService;
        this.processInternalsService = processInternalsService;
        this.heapDiagnosticsService = heapDiagnosticsService;
        this.enabledFeatures = {
            [constants_1.LICENSE_FEATURES.DYNAMIC_CREDENTIALS]: false,
            [constants_1.LICENSE_FEATURES.SHARING]: false,
            [constants_1.LICENSE_FEATURES.LDAP]: false,
            [constants_1.LICENSE_FEATURES.TYPE_AVAILABILITY_POLICIES]: false,
            [constants_1.LICENSE_FEATURES.SAML]: false,
            [constants_1.LICENSE_FEATURES.LOG_STREAMING]: false,
            [constants_1.LICENSE_FEATURES.ADVANCED_EXECUTION_FILTERS]: false,
            [constants_1.LICENSE_FEATURES.SOURCE_CONTROL]: false,
            [constants_1.LICENSE_FEATURES.GIT_CONNECTIONS]: false,
            [constants_1.LICENSE_FEATURES.VARIABLES]: false,
            [constants_1.LICENSE_FEATURES.API_DISABLED]: false,
            [constants_1.LICENSE_FEATURES.EXTERNAL_SECRETS]: false,
            [constants_1.LICENSE_FEATURES.SHOW_NON_PROD_BANNER]: false,
            [constants_1.LICENSE_FEATURES.DEBUG_IN_EDITOR]: false,
            [constants_1.LICENSE_FEATURES.BINARY_DATA_S3]: false,
            [constants_1.LICENSE_FEATURES.BINARY_DATA_AZURE]: false,
            [constants_1.LICENSE_FEATURES.EXECUTION_DATA_S3]: false,
            [constants_1.LICENSE_FEATURES.EXECUTION_DATA_AZURE]: false,
            [constants_1.LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES]: false,
            [constants_1.LICENSE_FEATURES.WORKER_VIEW]: false,
            [constants_1.LICENSE_FEATURES.ADVANCED_PERMISSIONS]: false,
            [constants_1.LICENSE_FEATURES.PROJECT_ROLE_ADMIN]: false,
            [constants_1.LICENSE_FEATURES.PROJECT_ROLE_EDITOR]: false,
            [constants_1.LICENSE_FEATURES.PROJECT_ROLE_VIEWER]: false,
            [constants_1.LICENSE_FEATURES.AI_ASSISTANT]: false,
            [constants_1.LICENSE_FEATURES.COMMUNITY_NODES_CUSTOM_REGISTRY]: false,
            [constants_1.LICENSE_FEATURES.ASK_AI]: false,
            [constants_1.LICENSE_FEATURES.AI_CREDITS]: false,
            [constants_1.LICENSE_FEATURES.AI_GATEWAY]: false,
            [constants_1.LICENSE_FEATURES.AI_GATEWAY_CLOUD_UBB]: false,
            [constants_1.LICENSE_FEATURES.AI_ASSISTANT_CLOUD_UBB_ENTITLEMENT]: false,
            [constants_1.LICENSE_FEATURES.FOLDERS]: false,
            [constants_1.LICENSE_FEATURES.INSIGHTS_VIEW_SUMMARY]: false,
            [constants_1.LICENSE_FEATURES.INSIGHTS_VIEW_DASHBOARD]: false,
            [constants_1.LICENSE_FEATURES.INSIGHTS_VIEW_HOURLY_DATA]: false,
            [constants_1.LICENSE_FEATURES.API_KEY_SCOPES]: false,
            [constants_1.LICENSE_FEATURES.OIDC]: false,
            [constants_1.LICENSE_FEATURES.MFA_ENFORCEMENT]: false,
            [constants_1.LICENSE_FEATURES.WORKFLOW_DIFFS]: false,
            [constants_1.LICENSE_FEATURES.NAMED_VERSIONS]: false,
            [constants_1.LICENSE_FEATURES.CUSTOM_ROLES]: false,
            [constants_1.LICENSE_FEATURES.AI_BUILDER]: false,
            [constants_1.LICENSE_FEATURES.PERSONAL_SPACE_POLICY]: false,
            [constants_1.LICENSE_FEATURES.TOKEN_EXCHANGE]: false,
            [constants_1.LICENSE_FEATURES.DATA_REDACTION]: false,
            [constants_1.LICENSE_FEATURES.WORKFLOW_REVIEWS]: false,
            [constants_1.LICENSE_FEATURES.OTEL_CUSTOM_SPAN_ATTRIBUTES]: false,
            [constants_1.LICENSE_FEATURES.WORKER_POOLS]: false,
            [constants_1.LICENSE_FEATURES.SCIM]: false,
            [constants_1.LICENSE_FEATURES.TRUSTED_SOURCE_MANAGE]: false,
        };
        this.numericFeatures = {
            [constants_1.LICENSE_QUOTAS.TRIGGER_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.TRIGGER_LIMIT],
            [constants_1.LICENSE_QUOTAS.VARIABLES_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.VARIABLES_LIMIT],
            [constants_1.LICENSE_QUOTAS.USERS_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.USERS_LIMIT],
            [constants_1.LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT],
            [constants_1.LICENSE_QUOTAS.TEAM_PROJECT_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.TEAM_PROJECT_LIMIT],
            [constants_1.LICENSE_QUOTAS.AI_CREDITS]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.AI_CREDITS],
            [constants_1.LICENSE_QUOTAS.AI_GATEWAY_BUDGET]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.AI_GATEWAY_BUDGET],
            [constants_1.LICENSE_QUOTAS.INSIGHTS_MAX_HISTORY_DAYS]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.INSIGHTS_MAX_HISTORY_DAYS],
            [constants_1.LICENSE_QUOTAS.INSIGHTS_RETENTION_MAX_AGE_DAYS]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.INSIGHTS_RETENTION_MAX_AGE_DAYS],
            [constants_1.LICENSE_QUOTAS.INSIGHTS_RETENTION_PRUNE_INTERVAL_DAYS]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.INSIGHTS_RETENTION_PRUNE_INTERVAL_DAYS],
            [constants_1.LICENSE_QUOTAS.WORKFLOWS_WITH_EVALUATION_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.WORKFLOWS_WITH_EVALUATION_LIMIT],
            [constants_1.LICENSE_QUOTAS.EVALUATION_CONCURRENCY_LIMIT]: E2EController_1.numericFeaturesDefaults[constants_1.LICENSE_QUOTAS.EVALUATION_CONCURRENCY_LIMIT],
        };
        this.coverageBaseline = new Map();
        license.isLicensed = (feature) => this.enabledFeatures[feature] ?? false;
        const getFeatureValue = (feature) => {
            if (feature in this.numericFeatures) {
                return this.numericFeatures[feature];
            }
            else {
                return constants_1.UNLIMITED_LICENSE_QUOTA;
            }
        };
        license.getValue = getFeatureValue;
        license.getPlanName = () => 'Enterprise';
    }
    async reset(req) {
        this.resetFeatures();
        await this.resetLogStreaming();
        await this.removeActiveWorkflows();
        await this.truncateAll();
        await this.reseedRolesAndScopes();
        await this.resetCache();
        await this.setupUserManagement(req.body.owner, req.body.members, req.body.admin, req.body.chat);
    }
    async pushSend(req) {
        const { pushRef: _, ...pushMsg } = req.body;
        this.push.broadcast(pushMsg);
    }
    setFeature(req) {
        const { enabled, feature } = req.body;
        this.enabledFeatures[feature] = enabled;
    }
    setQuota(req) {
        const { value, feature } = req.body;
        this.numericFeatures[feature] = value;
    }
    async setQueueMode(req) {
        this.executionsConfig.mode = req.body.enabled ? 'queue' : 'regular';
        return { success: true, message: `Queue mode set to ${this.executionsConfig.mode}` };
    }
    async countScheduledJobs(req) {
        const { workflowId, nodeId } = req.query;
        const count = await this.scheduledJobRepository.countByOwner(this.workflowScheduledJobOwner.member(workflowId, nodeId));
        return { count };
    }
    async getPollerState(req) {
        const { workflowId, nodeId } = req.query;
        const state = await this.pollerStateRepository.findState(workflowId, nodeId);
        return {
            cursor: state?.cursor ?? null,
            consecutiveErrors: state?.consecutiveErrors ?? 0,
            backoffUntil: state?.backoffUntil ?? null,
        };
    }
    async clearWorkflowStaticData(req) {
        await this.workflowStaticDataService.saveStaticDataById(req.body.workflowId, {});
        return { success: true };
    }
    async fireScheduledJobsNow(req) {
        const { workflowId, nodeId } = req.body;
        await this.scheduledJobRepository.backdateNextRunAt(this.workflowScheduledJobOwner.member(workflowId, nodeId), 0);
        return { success: true };
    }
    async backdateScheduledJob(req) {
        const { workflowId, nodeId, secondsAgo } = req.body;
        await this.scheduledJobRepository.backdateNextRunAt(this.workflowScheduledJobOwner.member(workflowId, nodeId), secondsAgo);
        return { success: true };
    }
    async getEnvFeatureFlags() {
        return (await this.frontendService.getSettings()).envFeatureFlags;
    }
    async setEnvFeatureFlags(req) {
        const { flags } = req.body;
        for (const key of Object.keys(flags)) {
            if (!key.startsWith('N8N_ENV_FEAT_')) {
                return {
                    success: false,
                    message: `Invalid flag key: ${key}. Must start with N8N_ENV_FEAT_`,
                };
            }
        }
        for (const key of Object.keys(process.env)) {
            if (key.startsWith('N8N_ENV_FEAT_')) {
                delete process.env[key];
            }
        }
        for (const [key, value] of Object.entries(flags)) {
            process.env[key] = value;
        }
        const currentFlags = (await this.frontendService.getSettings()).envFeatureFlags;
        return {
            success: true,
            message: 'Environment feature flags updated',
            flags: currentFlags,
        };
    }
    triggerGarbageCollection() {
        return this.heapDiagnosticsService.collectGarbage();
    }
    takeHeapSnapshot() {
        return this.heapDiagnosticsService.writeHeapSnapshot();
    }
    downloadHeapSnapshot(req) {
        return this.heapDiagnosticsService.openHeapSnapshot(String(req.params.filename));
    }
    async ensureCoverageSession() {
        if (!this.coverageSession) {
            const inspector = require('node:inspector/promises');
            this.coverageSession = new inspector.Session();
            this.coverageSession.connect();
            await this.coverageSession.post('Profiler.enable');
        }
        return this.coverageSession;
    }
    static coverageKey(url, fn) {
        return `${url} ${fn.functionName} ${fn.ranges[0]?.startOffset ?? 0}`;
    }
    static coverageCount(fn) {
        return fn.ranges.reduce((sum, range) => sum + range.count, 0);
    }
    static indexCoverage(scripts) {
        const index = new Map();
        for (const script of scripts) {
            for (const fn of script.functions) {
                index.set(E2EController_1.coverageKey(script.url, fn), E2EController_1.coverageCount(fn));
            }
        }
        return index;
    }
    static deltaCoverage(scripts, baseline) {
        const delta = [];
        for (const script of scripts) {
            const functions = script.functions.filter((fn) => E2EController_1.coverageCount(fn) >
                (baseline.get(E2EController_1.coverageKey(script.url, fn)) ?? 0));
            if (functions.length)
                delta.push({ ...script, functions });
        }
        return delta;
    }
    async startCoverage() {
        const session = await this.ensureCoverageSession();
        const { result } = await session.post('Profiler.getBestEffortCoverage');
        this.coverageBaseline = E2EController_1.indexCoverage(result);
        return { success: true };
    }
    async takeCoverage() {
        if (!this.coverageSession)
            return { success: false, result: [] };
        const { result } = await this.coverageSession.post('Profiler.getBestEffortCoverage');
        return { success: true, result: E2EController_1.deltaCoverage(result, this.coverageBaseline) };
    }
    getInternals() {
        return this.processInternalsService.collect();
    }
    getMemoryMaps() {
        const fs = require('node:fs');
        const memUsage = process.memoryUsage();
        const result = {
            processMemoryUsage: {
                rss: Math.round(memUsage.rss / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024),
            },
            rollup: null,
            mappings: null,
            raw: null,
        };
        try {
            const rollupText = fs.readFileSync('/proc/self/smaps_rollup', 'utf-8');
            const rollup = {};
            for (const line of rollupText.split('\n')) {
                const match = line.match(/^(\w+):\s+(\d+)\s+kB$/);
                if (match) {
                    rollup[`${match[1]}MB`] = Math.round(Number(match[2]) / 1024);
                }
            }
            result.rollup = rollup;
        }
        catch {
        }
        try {
            const smapsText = fs.readFileSync('/proc/self/smaps', 'utf-8');
            result.raw = smapsText;
            const grouped = new Map();
            let currentName = '[unknown]';
            for (const line of smapsText.split('\n')) {
                const headerMatch = line.match(/^[0-9a-f]+-[0-9a-f]+\s+\S+\s+\S+\s+\S+\s+\S+\s*(.*)/);
                if (headerMatch) {
                    const path = headerMatch[1].trim();
                    currentName = path || '[anon]';
                    if (!grouped.has(currentName)) {
                        grouped.set(currentName, { rssKB: 0, pssKB: 0, count: 0 });
                    }
                    const entry = grouped.get(currentName);
                    entry.count++;
                    continue;
                }
                const rssMatch = line.match(/^Rss:\s+(\d+)\s+kB$/);
                if (rssMatch) {
                    const entry = grouped.get(currentName);
                    if (entry)
                        entry.rssKB += Number(rssMatch[1]);
                    continue;
                }
                const pssMatch = line.match(/^Pss:\s+(\d+)\s+kB$/);
                if (pssMatch) {
                    const entry = grouped.get(currentName);
                    if (entry)
                        entry.pssKB += Number(pssMatch[1]);
                }
            }
            result.mappings = [...grouped.entries()]
                .map(([name, { rssKB, pssKB, count }]) => ({
                name,
                rssMB: Math.round((rssKB / 1024) * 10) / 10,
                pssMB: Math.round((pssKB / 1024) * 10) / 10,
                count,
            }))
                .filter((m) => m.rssMB > 0)
                .sort((a, b) => b.rssMB - a.rssMB);
        }
        catch {
        }
        return result;
    }
    resetFeatures() {
        for (const feature of Object.keys(this.enabledFeatures)) {
            this.enabledFeatures[feature] = false;
        }
        for (const feature of Object.keys(this.numericFeatures)) {
            this.numericFeatures[feature] =
                E2EController_1.numericFeaturesDefaults[feature];
        }
    }
    async removeActiveWorkflows() {
        this.workflowRunner.removeAllQueuedWorkflowActivations();
        await this.workflowRunner.removeAll();
    }
    async resetLogStreaming() {
        const destinations = await this.logStreamingDestinationsService.findDestination();
        for (const destination of destinations) {
            if (destination.id) {
                await this.logStreamingDestinationsService.removeDestination(destination.id, false);
            }
        }
    }
    async truncateAll() {
        const { connection } = this.settingsRepo.manager;
        const dbType = connection.options.type;
        for (const table of tablesToTruncate) {
            try {
                if (dbType === 'postgres') {
                    await connection.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`);
                }
                else {
                    await connection.query(`DELETE FROM "${table}";`);
                    if (dbType === 'sqlite') {
                        await connection.query(`DELETE FROM sqlite_sequence WHERE name = '${table}';`);
                    }
                }
            }
            catch (error) {
                di_1.Container.get(backend_common_1.Logger).warn(`Dropping Table "${table}" for E2E Reset error`, {
                    error: error,
                });
            }
        }
    }
    async reseedRolesAndScopes() {
        await di_1.Container.get(db_1.AuthRolesService).init();
    }
    async setupUserManagement(owner, members, admin, chat) {
        const userCreatePromises = [
            this.userRepository.createUserWithProject({
                id: (0, uuid_1.v4)(),
                ...owner,
                password: await this.passwordUtility.hash(owner.password),
                role: {
                    slug: db_1.GLOBAL_OWNER_ROLE.slug,
                },
            }),
        ];
        userCreatePromises.push(this.userRepository.createUserWithProject({
            id: (0, uuid_1.v4)(),
            ...admin,
            password: await this.passwordUtility.hash(admin.password),
            role: {
                slug: db_1.GLOBAL_ADMIN_ROLE.slug,
            },
        }));
        for (const { password, ...payload } of members) {
            userCreatePromises.push(this.userRepository.createUserWithProject({
                id: (0, uuid_1.v4)(),
                ...payload,
                password: await this.passwordUtility.hash(password),
                role: {
                    slug: db_1.GLOBAL_MEMBER_ROLE.slug,
                },
            }));
        }
        userCreatePromises.push(this.userRepository.createUserWithProject({
            id: (0, uuid_1.v4)(),
            ...chat,
            password: await this.passwordUtility.hash(chat.password),
            role: {
                slug: db_1.GLOBAL_CHAT_USER_ROLE.slug,
            },
        }));
        const [newOwner] = await Promise.all(userCreatePromises);
        if (owner?.mfaSecret && owner.mfaRecoveryCodes?.length) {
            const { encryptedRecoveryCodes, encryptedSecret } = await this.mfaService.encryptSecretAndRecoveryCodes(owner.mfaSecret, owner.mfaRecoveryCodes);
            await this.userRepository.update(newOwner.user.id, {
                mfaSecret: encryptedSecret,
                mfaRecoveryCodes: encryptedRecoveryCodes,
            });
        }
    }
    async resetCache() {
        await this.cacheService.reset();
    }
};
exports.E2EController = E2EController;
E2EController.numericFeaturesDefaults = {
    [constants_1.LICENSE_QUOTAS.TRIGGER_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.VARIABLES_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.USERS_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.WORKFLOW_HISTORY_PRUNE_LIMIT]: -1,
    [constants_1.LICENSE_QUOTAS.TEAM_PROJECT_LIMIT]: 0,
    [constants_1.LICENSE_QUOTAS.AI_CREDITS]: 0,
    [constants_1.LICENSE_QUOTAS.AI_GATEWAY_BUDGET]: 0,
    [constants_1.LICENSE_QUOTAS.INSIGHTS_MAX_HISTORY_DAYS]: 7,
    [constants_1.LICENSE_QUOTAS.INSIGHTS_RETENTION_MAX_AGE_DAYS]: 30,
    [constants_1.LICENSE_QUOTAS.INSIGHTS_RETENTION_PRUNE_INTERVAL_DAYS]: 180,
    [constants_1.LICENSE_QUOTAS.WORKFLOWS_WITH_EVALUATION_LIMIT]: 1,
    [constants_1.LICENSE_QUOTAS.EVALUATION_CONCURRENCY_LIMIT]: 0,
};
__decorate([
    (0, decorators_1.Post)('/reset', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "reset", null);
__decorate([
    (0, decorators_1.Post)('/push', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "pushSend", null);
__decorate([
    (0, decorators_1.Patch)('/feature', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "setFeature", null);
__decorate([
    (0, decorators_1.Patch)('/quota', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "setQuota", null);
__decorate([
    (0, decorators_1.Patch)('/queue-mode', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "setQueueMode", null);
__decorate([
    (0, decorators_1.Get)('/scheduled-jobs/count', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "countScheduledJobs", null);
__decorate([
    (0, decorators_1.Get)('/poller-state', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "getPollerState", null);
__decorate([
    (0, decorators_1.Post)('/workflow-static-data/clear', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "clearWorkflowStaticData", null);
__decorate([
    (0, decorators_1.Post)('/scheduled-jobs/fire-now', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "fireScheduledJobsNow", null);
__decorate([
    (0, decorators_1.Post)('/scheduled-jobs/backdate', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "backdateScheduledJob", null);
__decorate([
    (0, decorators_1.Get)('/env-feature-flags', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "getEnvFeatureFlags", null);
__decorate([
    (0, decorators_1.Patch)('/env-feature-flags', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "setEnvFeatureFlags", null);
__decorate([
    (0, decorators_1.Post)('/gc', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "triggerGarbageCollection", null);
__decorate([
    (0, decorators_1.Post)('/heap-snapshot', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "takeHeapSnapshot", null);
__decorate([
    (0, decorators_1.Get)('/heap-snapshot/:filename', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "downloadHeapSnapshot", null);
__decorate([
    (0, decorators_1.Post)('/coverage/start', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "startCoverage", null);
__decorate([
    (0, decorators_1.Post)('/coverage/take', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], E2EController.prototype, "takeCoverage", null);
__decorate([
    (0, decorators_1.Get)('/internals', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "getInternals", null);
__decorate([
    (0, decorators_1.Get)('/memory-maps', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], E2EController.prototype, "getMemoryMaps", null);
exports.E2EController = E2EController = E2EController_1 = __decorate([
    (0, decorators_1.RestController)('/e2e'),
    __metadata("design:paramtypes", [license_1.License, db_1.SettingsRepository, active_workflow_manager_1.ActiveWorkflowManager, mfa_service_1.MfaService, backend_services_1.CacheService, push_1.Push, password_utility_1.PasswordUtility, db_1.UserRepository, frontend_service_1.FrontendService, config_1.ExecutionsConfig, log_streaming_destination_service_1.LogStreamingDestinationService, db_1.ScheduledJobRepository, workflow_scheduled_job_owner_1.WorkflowScheduledJobOwner, db_1.PollerStateRepository, workflow_static_data_service_1.WorkflowStaticDataService, process_internals_service_1.ProcessInternalsService, heap_diagnostics_service_1.HeapDiagnosticsService])
], E2EController);
//# sourceMappingURL=e2e.controller.js.map