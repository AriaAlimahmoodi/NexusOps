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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const uniq_1 = __importDefault(require("lodash/uniq"));
const n8n_core_1 = require("n8n-core");
const path_1 = __importDefault(require("path"));
const backend_services_1 = require("@n8n/backend-services");
const ai_usage_service_1 = require("./ai-usage.service");
const workflow_review_policy_service_1 = require("./workflow-review-policy.service");
const config_2 = __importDefault(require("../config"));
const constants_2 = require("../constants");
const credential_sharing_1 = require("../constants/credential-sharing");
const credential_types_1 = require("../credential-types");
const credentials_overwrites_1 = require("../credentials-overwrites");
const evaluation_concurrency_helper_1 = require("../evaluation.ee/evaluation-concurrency.helper");
const license_1 = require("../license");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const mfa_service_1 = require("../mfa/mfa.service");
const community_packages_config_1 = require("../modules/community-packages/community-packages.config");
const inbox_service_1 = require("../modules/inbox/inbox.service");
const public_api_1 = require("../public-api");
const push_config_1 = require("../push/push.config");
const ownership_service_1 = require("../services/ownership.service");
const sso_helpers_1 = require("../sso.ee/sso-helpers");
const email_1 = require("../user-management/email");
const health_endpoint_util_1 = require("../utils/health-endpoint.util");
const workflow_history_helper_1 = require("../workflows/workflow-history/workflow-history-helper");
const DYNAMIC_BANNER_FILTERS_CACHE_TTL = 30 * constants_1.Time.seconds.toMilliseconds;
let FrontendService = class FrontendService {
    constructor(globalConfig, logger, loadNodesAndCredentials, credentialTypes, credentialsOverwrites, license, mailer, instanceSettings, urlService, securityConfig, pushConfig, binaryDataConfig, licenseState, moduleRegistry, mfaService, ownershipService, aiUsageService, workflowRepository, workflowReviewPolicyService, inboxService) {
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.credentialTypes = credentialTypes;
        this.credentialsOverwrites = credentialsOverwrites;
        this.license = license;
        this.mailer = mailer;
        this.instanceSettings = instanceSettings;
        this.urlService = urlService;
        this.securityConfig = securityConfig;
        this.pushConfig = pushConfig;
        this.binaryDataConfig = binaryDataConfig;
        this.licenseState = licenseState;
        this.moduleRegistry = moduleRegistry;
        this.mfaService = mfaService;
        this.ownershipService = ownershipService;
        this.aiUsageService = aiUsageService;
        this.workflowRepository = workflowRepository;
        this.workflowReviewPolicyService = workflowReviewPolicyService;
        this.inboxService = inboxService;
        this.writeQueue = Promise.resolve();
        loadNodesAndCredentials.addPostProcessor(async () => await this.generateTypes());
        credentialsOverwrites.registerReloadHandler(async () => await this.generateTypes());
        void this.generateTypes();
    }
    collectEnvFeatureFlags() {
        const envFeatureFlags = {};
        for (const [key, value] of Object.entries(process.env)) {
            if (key.startsWith('N8N_ENV_FEAT_') && value !== undefined) {
                envFeatureFlags[key] = value;
            }
        }
        return envFeatureFlags;
    }
    async getShowSetupOnFirstLoad() {
        const previewMode = process.env.N8N_PREVIEW_MODE === 'true';
        const hasInstanceOwner = await this.ownershipService.hasInstanceOwner();
        return previewMode ? false : !hasInstanceOwner;
    }
    async initSettings() {
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        const restEndpoint = this.globalConfig.endpoints.rest;
        const telemetrySettings = {
            enabled: this.globalConfig.diagnostics.enabled,
        };
        if (telemetrySettings.enabled) {
            const conf = this.globalConfig.diagnostics.frontendConfig;
            const [key, url] = conf.split(';');
            const proxy = `${instanceBaseUrl}/${restEndpoint}/telemetry/proxy`;
            const sourceConfig = `${instanceBaseUrl}/${restEndpoint}/telemetry/rudderstack`;
            if (!key || !url) {
                this.logger.warn('Diagnostics frontend config is invalid');
                telemetrySettings.enabled = false;
            }
            telemetrySettings.config = { key, url, proxy, sourceConfig };
        }
        const previewMode = process.env.N8N_PREVIEW_MODE === 'true';
        this.settings = {
            settingsMode: 'authenticated',
            inE2ETests: constants_2.inE2ETests,
            isDocker: this.instanceSettings.isDocker,
            databaseType: this.globalConfig.database.type,
            previewMode,
            endpointForm: this.globalConfig.endpoints.form,
            endpointFormTest: this.globalConfig.endpoints.formTest,
            endpointFormWaiting: this.globalConfig.endpoints.formWaiting,
            endpointMcp: this.globalConfig.endpoints.mcp,
            endpointMcpTest: this.globalConfig.endpoints.mcpTest,
            endpointWebhook: this.globalConfig.endpoints.webhook,
            endpointWebhookTest: this.globalConfig.endpoints.webhookTest,
            endpointWebhookWaiting: this.globalConfig.endpoints.webhookWaiting,
            endpointHealth: (0, health_endpoint_util_1.resolveFrontendHealthEndpointPath)(this.globalConfig),
            healthCheckTimeoutMs: this.globalConfig.endpoints.frontendHealthCheckTimeoutMs,
            saveDataErrorExecution: this.globalConfig.executions.saveDataOnError,
            saveDataSuccessExecution: this.globalConfig.executions.saveDataOnSuccess,
            saveManualExecutions: this.globalConfig.executions.saveDataManualExecutions,
            saveExecutionProgress: this.globalConfig.executions.saveExecutionProgress,
            executionTimeout: this.globalConfig.executions.timeout,
            maxExecutionTimeout: this.globalConfig.executions.maxTimeout,
            workflowCallerPolicyDefaultOption: this.globalConfig.workflows.callerPolicyDefaultOption,
            excludeNodes: this.globalConfig.nodes.exclude,
            timezone: this.globalConfig.generic.timezone,
            urlBaseWebhook: this.urlService.getWebhookBaseUrl(),
            urlBaseEditor: instanceBaseUrl,
            urlBaseWebhookTest: this.urlService.getTestWebhookBaseUrl(),
            binaryDataMode: this.binaryDataConfig.mode,
            nodeJsVersion: process.version.replace(/^v/, ''),
            nodeEnv: process.env.NODE_ENV,
            versionCli: constants_2.N8N_VERSION,
            concurrency: this.globalConfig.executions.concurrency.productionLimit,
            evaluationConcurrencyLimit: (0, evaluation_concurrency_helper_1.resolveEvaluationConcurrencyLimit)(this.globalConfig.executions, this.license),
            authCookie: {
                secure: this.globalConfig.auth.cookie.secure,
            },
            releaseChannel: this.globalConfig.generic.releaseChannel,
            oauthCallbackUrls: {
                oauth1: `${instanceBaseUrl}/${restEndpoint}/oauth1-credential/callback`,
                oauth2: `${instanceBaseUrl}/${restEndpoint}/oauth2-credential/callback`,
            },
            jwksUri: `${instanceBaseUrl}/${restEndpoint}/.well-known/jwks.json`,
            versionNotifications: {
                enabled: this.globalConfig.versionNotifications.enabled,
                endpoint: this.globalConfig.versionNotifications.endpoint,
                whatsNewEnabled: this.globalConfig.versionNotifications.whatsNewEnabled,
                whatsNewEndpoint: this.globalConfig.versionNotifications.whatsNewEndpoint,
                infoUrl: this.globalConfig.versionNotifications.infoUrl,
            },
            dynamicBanners: {
                endpoint: this.globalConfig.dynamicBanners.endpoint,
                enabled: this.globalConfig.dynamicBanners.enabled && this.globalConfig.diagnostics.enabled,
                filters: {
                    publishedWorkflowCount: 0,
                },
            },
            instanceId: this.instanceSettings.instanceId,
            telemetry: telemetrySettings,
            posthog: {
                enabled: this.globalConfig.diagnostics.enabled,
                apiHost: this.globalConfig.diagnostics.posthogConfig.apiHost,
                apiKey: this.globalConfig.diagnostics.posthogConfig.apiKey,
                autocapture: false,
                disableSessionRecording: this.globalConfig.deployment.type !== 'cloud',
                proxy: `${instanceBaseUrl}/${restEndpoint}/ph`,
                debug: this.globalConfig.logging.level === 'debug',
            },
            personalizationSurveyEnabled: this.globalConfig.personalization.enabled && this.globalConfig.diagnostics.enabled,
            defaultLocale: this.globalConfig.defaultLocale,
            userManagement: {
                quota: this.license.getUsersLimit(),
                showSetupOnFirstLoad: await this.getShowSetupOnFirstLoad(),
                smtpSetup: this.mailer.isEmailSetUp,
                authenticationMethod: (0, sso_helpers_1.getCurrentAuthenticationMethod)(),
                passwordMinLength: this.globalConfig.userManagement.password.minLength,
            },
            sso: {
                managedByEnv: this.globalConfig.instanceSettingsLoader.ssoManagedByEnv,
                saml: {
                    loginEnabled: false,
                    loginLabel: '',
                },
                ldap: {
                    loginEnabled: false,
                    loginLabel: '',
                },
                oidc: {
                    loginEnabled: false,
                    loginUrl: `${instanceBaseUrl}/${restEndpoint}/sso/oidc/login`,
                    callbackUrl: `${instanceBaseUrl}/${restEndpoint}/sso/oidc/callback`,
                },
            },
            logStreaming: {
                managedByEnv: this.globalConfig.instanceSettingsLoader.logStreamingManagedByEnv,
            },
            dataTables: {
                maxSize: this.globalConfig.dataTable.maxSize,
            },
            publicApi: {
                enabled: (0, public_api_1.isApiKeyAuthEnabled)(),
                latestVersion: 1,
                path: this.globalConfig.publicApi.path,
                swaggerUi: {
                    enabled: !this.globalConfig.publicApi.swaggerUiDisabled,
                },
            },
            workflowTagsDisabled: this.globalConfig.tags.disabled,
            workflowsAutosaveDisabled: this.globalConfig.workflows.autosaveDisabled,
            workflowsGroupsWithTriggersEnabled: this.globalConfig.workflows.groupsWithTriggersEnabled,
            workflowsGroupsWithManyBoundariesEnabled: this.globalConfig.workflows.groupsWithManyBoundariesEnabled,
            useWorkflowPublicationService: this.globalConfig.workflows.useWorkflowPublicationService,
            granularCredentialSharing: (0, credential_sharing_1.isCredSharingEnabled)(),
            logLevel: this.globalConfig.logging.level,
            hiringBannerEnabled: this.globalConfig.hiringBanner.enabled,
            aiAssistant: {
                enabled: false,
                setup: false,
                cloudUbbEnabled: false,
            },
            templates: {
                enabled: this.globalConfig.templates.enabled,
                host: this.globalConfig.templates.host,
            },
            executionMode: this.globalConfig.executions.mode,
            isMultiMain: this.instanceSettings.isMultiMain,
            pushBackend: this.pushConfig.backend,
            communityNodesEnabled: di_1.Container.get(community_packages_config_1.CommunityPackagesConfig).enabled,
            unverifiedCommunityNodesEnabled: di_1.Container.get(community_packages_config_1.CommunityPackagesConfig).unverifiedEnabled,
            communityNodesManagedByEnv: this.globalConfig.instanceSettingsLoader.communityPackagesManagedByEnv,
            deployment: {
                type: this.globalConfig.deployment.type,
            },
            allowedModules: {
                builtIn: process.env.NODE_FUNCTION_ALLOW_BUILTIN?.split(',') ?? undefined,
                external: process.env.NODE_FUNCTION_ALLOW_EXTERNAL?.split(',') ?? undefined,
            },
            enterprise: {
                sharing: false,
                ldap: false,
                saml: false,
                oidc: false,
                mfaEnforcement: false,
                logStreaming: false,
                advancedExecutionFilters: false,
                variables: false,
                sourceControl: false,
                auditLogs: false,
                externalSecrets: false,
                showNonProdBanner: false,
                debugInEditor: false,
                binaryDataS3: false,
                workerView: false,
                advancedPermissions: false,
                workflowDiffs: false,
                namedVersions: false,
                provisioning: false,
                projects: {
                    team: {
                        limit: 0,
                    },
                },
                customRoles: false,
                personalSpacePolicy: false,
                dataRedaction: false,
                otelCustomSpanAttributes: false,
                workflowReviews: false,
            },
            mfa: {
                enabled: false,
                enforced: false,
            },
            hideUsagePage: this.globalConfig.hideUsagePage,
            license: {
                consumerId: 'unknown',
                environment: this.globalConfig.license.tenantId === 1 ? 'production' : 'staging',
            },
            variables: {
                limit: 0,
            },
            banners: {
                dismissed: [],
            },
            askAi: {
                enabled: false,
            },
            aiBuilder: {
                enabled: false,
                setup: false,
            },
            aiCredits: {
                enabled: false,
                credits: 0,
                setup: false,
            },
            ai: {
                allowSendingParameterValues: true,
            },
            workflowHistory: {
                pruneTime: (0, workflow_history_helper_1.getWorkflowHistoryPruneTime)(),
                licensePruneTime: (0, workflow_history_helper_1.getWorkflowHistoryLicensePruneTime)(),
            },
            pruning: {
                isEnabled: this.globalConfig.executions.pruneData,
                maxAge: this.globalConfig.executions.pruneDataMaxAge,
                maxCount: this.globalConfig.executions.pruneDataMaxCount,
            },
            security: {
                blockFileAccessToN8nFiles: this.securityConfig.blockFileAccessToN8nFiles,
                postMessageAllowedOrigins: this.securityConfig.postMessageAllowedOrigins
                    .split(',')
                    .map((origin) => origin.trim())
                    .filter((origin) => origin !== '')
                    .map((origin) => {
                    try {
                        const normalized = new URL(origin).origin;
                        return normalized === 'null' ? origin : normalized;
                    }
                    catch {
                        return origin;
                    }
                }),
            },
            chatTrigger: {
                disablePublicChat: this.globalConfig.chatTrigger.disablePublicChat,
            },
            easyAIWorkflowOnboarded: false,
            folders: {
                enabled: false,
            },
            workerPools: {
                enabled: false,
            },
            evaluation: {
                quota: this.licenseState.getMaxWorkflowsWithEvaluations(),
                collectionsEnabled: this.globalConfig.evaluation.collectionsEnabled,
                configEvalsEnabled: this.globalConfig.evaluation.configEvalsEnabled,
                agentEvalsEnabled: this.globalConfig.evaluation.agentEvalsEnabled,
                forceAgentWorthTesting: this.globalConfig.evaluation.forceAgentWorthTesting,
            },
            activeModules: this.moduleRegistry.getActiveModules(),
            canvasOnly: this.globalConfig.canvasOnly.enabled,
            collaboration: {
                crdt: this.globalConfig.collaboration.crdt,
            },
            envFeatureFlags: this.collectEnvFeatureFlags(),
            expressionEngine: this.globalConfig.expressionEngine.frontendEngine,
        };
    }
    async generateTypes() {
        this.overwriteCredentialsProperties();
        const types = await this.loadNodesAndCredentials.collectTypes();
        await this.enqueueWrite(types);
    }
    async enqueueWrite(types) {
        const write = this.writeQueue.then(async () => await this.writeTypesFiles(types));
        this.writeQueue = write.catch(() => { });
        await write;
    }
    async writeTypesFiles({ credentials, nodes }) {
        const { staticCacheDir } = this.instanceSettings;
        await (0, promises_1.mkdir)(path_1.default.join(staticCacheDir, 'types'), { recursive: true });
        await this.writeStaticJSON('nodes', nodes);
        const nodeVersionIdentifiers = this.getNodeVersionIdentifiers(nodes);
        await this.writeStaticJSON('node-versions', nodeVersionIdentifiers);
        await this.writeStaticJSON('credentials', credentials);
    }
    async getSettings() {
        if (!this.settings) {
            await this.initSettings();
        }
        const restEndpoint = this.globalConfig.endpoints.rest;
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        this.settings.urlBaseWebhook = this.urlService.getWebhookBaseUrl();
        this.settings.urlBaseEditor = instanceBaseUrl;
        this.settings.urlBaseWebhookTest = this.urlService.getTestWebhookBaseUrl();
        this.settings.oauthCallbackUrls = {
            oauth1: `${instanceBaseUrl}/${restEndpoint}/oauth1-credential/callback`,
            oauth2: `${instanceBaseUrl}/${restEndpoint}/oauth2-credential/callback`,
        };
        this.settings.jwksUri = `${instanceBaseUrl}/${restEndpoint}/.well-known/jwks.json`;
        this.settings.dynamicBanners.filters.publishedWorkflowCount =
            await this.getPublishedWorkflowCountForDynamicBanners();
        Object.assign(this.settings.userManagement, {
            quota: this.license.getUsersLimit(),
            authenticationMethod: (0, sso_helpers_1.getCurrentAuthenticationMethod)(),
            showSetupOnFirstLoad: await this.getShowSetupOnFirstLoad(),
        });
        let dismissedBanners = [];
        try {
            dismissedBanners = config_2.default.getEnv('ui.banners.dismissed') ?? [];
        }
        catch {
        }
        this.settings.banners.dismissed = dismissedBanners;
        try {
            this.settings.easyAIWorkflowOnboarded = config_2.default.getEnv('easyAIWorkflowOnboarded') ?? false;
        }
        catch {
            this.settings.easyAIWorkflowOnboarded = false;
        }
        try {
            this.settings.ai.allowSendingParameterValues =
                await this.aiUsageService.isParameterValueSharingAllowed();
        }
        catch {
            this.settings.ai.allowSendingParameterValues =
                this.globalConfig.ai.allowSendingParameterValues;
        }
        const isS3Selected = this.binaryDataConfig.mode === 's3';
        const isS3Available = this.binaryDataConfig.availableModes.includes('s3');
        const isS3Licensed = this.license.isBinaryDataS3Licensed();
        const isAiAssistantEnabled = this.license.isAiAssistantEnabled();
        const isAskAiEnabled = this.license.isAskAiEnabled();
        const isAiCreditsEnabled = this.license.isAiCreditsEnabled();
        const isAiBuilderEnabled = this.license.isLicensed(constants_1.LICENSE_FEATURES.AI_BUILDER);
        this.settings.license.planName = this.license.getPlanName();
        this.settings.license.consumerId = this.license.getConsumerId();
        this.settings.evaluationConcurrencyLimit = (0, evaluation_concurrency_helper_1.resolveEvaluationConcurrencyLimit)(this.globalConfig.executions, this.license);
        Object.assign(this.settings.enterprise, {
            sharing: this.license.isSharingEnabled(),
            logStreaming: this.license.isLogStreamingEnabled(),
            ldap: this.license.isLdapEnabled(),
            saml: this.license.isSamlEnabled(),
            oidc: this.licenseState.isOidcLicensed(),
            mfaEnforcement: this.licenseState.isMFAEnforcementLicensed(),
            provisioning: false,
            advancedExecutionFilters: this.license.isAdvancedExecutionFiltersEnabled(),
            variables: this.license.isVariablesEnabled(),
            sourceControl: this.license.isSourceControlLicensed(),
            externalSecrets: this.license.isExternalSecretsEnabled(),
            showNonProdBanner: this.license.isLicensed(constants_1.LICENSE_FEATURES.SHOW_NON_PROD_BANNER),
            debugInEditor: this.license.isDebugInEditorLicensed(),
            binaryDataS3: isS3Available && isS3Selected && isS3Licensed,
            workerView: this.license.isWorkerViewLicensed(),
            advancedPermissions: this.license.isAdvancedPermissionsLicensed(),
            workflowDiffs: this.licenseState.isWorkflowDiffsLicensed(),
            namedVersions: this.license.isLicensed(constants_1.LICENSE_FEATURES.NAMED_VERSIONS),
            customRoles: this.licenseState.isCustomRolesLicensed(),
            personalSpacePolicy: this.licenseState.isPersonalSpacePolicyLicensed(),
            dataRedaction: this.licenseState.isDataRedactionLicensed(),
            otelCustomSpanAttributes: this.licenseState.isOtelCustomSpanAttributesLicensed(),
            workflowReviews: this.licenseState.isWorkflowReviewsLicensed(),
        });
        this.settings.workerPools.enabled =
            this.globalConfig.queue.workerPool.enabled && this.licenseState.isWorkerPoolsLicensed();
        if (this.license.isLdapEnabled()) {
            Object.assign(this.settings.sso.ldap, {
                loginLabel: this.globalConfig.sso.ldap.loginLabel,
                loginEnabled: this.globalConfig.sso.ldap.loginEnabled,
            });
        }
        if (this.license.isSamlEnabled()) {
            Object.assign(this.settings.sso.saml, {
                loginLabel: (0, sso_helpers_1.getSamlLoginLabel)(),
                loginEnabled: this.globalConfig.sso.saml.loginEnabled,
            });
        }
        if (this.licenseState.isOidcLicensed()) {
            Object.assign(this.settings.sso.oidc, {
                loginEnabled: this.globalConfig.sso.oidc.loginEnabled,
            });
        }
        if (this.license.isVariablesEnabled()) {
            this.settings.variables.limit = this.license.getVariablesLimit();
        }
        if (isAiAssistantEnabled) {
            this.settings.aiAssistant.enabled = isAiAssistantEnabled;
            this.settings.aiAssistant.setup =
                !!this.globalConfig.aiAssistant.baseUrl || !!process.env.N8N_AI_ANTHROPIC_KEY;
            this.settings.aiAssistant.cloudUbbEnabled =
                this.licenseState.isAiAssistantCloudUbbEntitlementLicensed();
        }
        if (isAskAiEnabled) {
            this.settings.askAi.enabled = isAskAiEnabled;
        }
        if (isAiCreditsEnabled) {
            this.settings.aiCredits.enabled = isAiCreditsEnabled;
            this.settings.aiCredits.credits = this.license.getAiCredits();
            this.settings.aiCredits.setup = !!this.globalConfig.aiAssistant.baseUrl;
        }
        const isAiGatewayEnabled = this.globalConfig.aiGateway.enabled &&
            this.licenseState.isAiGatewayLicensed() &&
            !!this.globalConfig.aiAssistant.baseUrl;
        if (isAiGatewayEnabled) {
            this.settings.aiGateway = {
                enabled: true,
                budget: this.license.getValue(constants_1.LICENSE_QUOTAS.AI_GATEWAY_BUDGET) ?? 0,
                cloudUbbEnabled: this.licenseState.isAiGatewayCloudUbbLicensed(),
            };
        }
        if (isAiBuilderEnabled) {
            this.settings.aiBuilder.enabled = isAiBuilderEnabled;
            this.settings.aiBuilder.setup =
                !!this.globalConfig.aiAssistant.baseUrl || !!this.globalConfig.aiBuilder.apiKey;
        }
        this.settings.mfa.enabled = this.globalConfig.mfa.enabled;
        this.settings.mfa.enforced = await this.mfaService.isMFAEnforced();
        if (this.licenseState.isWorkflowReviewsLicensed()) {
            this.settings.workflowReviews = await this.workflowReviewPolicyService.get();
        }
        else {
            delete this.settings.workflowReviews;
        }
        this.settings.inbox = this.moduleRegistry.isActive('inbox')
            ? await this.inboxService.getSettings()
            : { enabled: false, availableTypes: [], failedTypes: [] };
        this.settings.executionMode = this.globalConfig.executions.mode;
        this.settings.binaryDataMode = this.binaryDataConfig.mode;
        this.settings.enterprise.projects.team.limit = this.license.getTeamProjectLimit();
        this.settings.folders.enabled = this.license.isFoldersEnabled();
        this.settings.evaluation.quota = this.licenseState.getMaxWorkflowsWithEvaluations();
        this.settings.envFeatureFlags = this.collectEnvFeatureFlags();
        return this.settings;
    }
    async getPublishedWorkflowCountForDynamicBanners() {
        if (!this.settings.dynamicBanners.enabled)
            return 0;
        const now = Date.now();
        if (this.publishedWorkflowCountCache && this.publishedWorkflowCountCache.expiresAt > now) {
            return this.publishedWorkflowCountCache.value;
        }
        try {
            this.publishedWorkflowCountRequest ??= this.workflowRepository
                .getPublishedCount()
                .finally(() => {
                this.publishedWorkflowCountRequest = undefined;
            });
            const value = await this.publishedWorkflowCountRequest;
            this.publishedWorkflowCountCache = {
                value,
                expiresAt: Date.now() + DYNAMIC_BANNER_FILTERS_CACHE_TTL,
            };
            return value;
        }
        catch (error) {
            this.logger.warn('Failed to fetch published workflow count for dynamic banners', { error });
            return this.publishedWorkflowCountCache?.value ?? 0;
        }
    }
    async getPublicSettings(includeMfaSettings) {
        const { defaultLocale, userManagement: { authenticationMethod, showSetupOnFirstLoad, smtpSetup, passwordMinLength }, sso: { saml: ssoSaml, ldap: ssoLdap, oidc: ssoOidc }, authCookie, previewMode, enterprise: { saml, ldap, oidc }, mfa, communityNodesEnabled, } = await this.getSettings();
        const publicSettings = {
            settingsMode: 'public',
            defaultLocale,
            userManagement: {
                authenticationMethod,
                showSetupOnFirstLoad,
                smtpSetup,
                passwordMinLength,
            },
            sso: {
                saml: {
                    loginEnabled: ssoSaml.loginEnabled,
                },
                ldap: ssoLdap,
                oidc: {
                    loginEnabled: ssoOidc.loginEnabled,
                    loginUrl: ssoOidc.loginUrl,
                },
            },
            authCookie,
            previewMode,
            enterprise: { saml, ldap, oidc },
            communityNodesEnabled,
        };
        if (includeMfaSettings) {
            publicSettings.mfa = mfa;
        }
        return publicSettings;
    }
    getModuleSettings() {
        return Object.fromEntries(this.moduleRegistry.settings);
    }
    getNodeVersionIdentifiers(nodes) {
        const identifiers = new Set();
        for (const node of nodes) {
            if (!node?.name || node.version === undefined)
                continue;
            const versions = Array.isArray(node.version) ? node.version : [node.version];
            for (const version of versions) {
                if (version === undefined)
                    continue;
                identifiers.add(`${node.name}@${String(version)}`);
            }
        }
        return Array.from(identifiers);
    }
    async writeStaticJSON(name, data) {
        const { staticCacheDir } = this.instanceSettings;
        const filePath = path_1.default.join(staticCacheDir, `types/${name}.json`);
        const stream = (0, fs_1.createWriteStream)(filePath, 'utf-8');
        return await new Promise((resolve, reject) => {
            stream.on('error', reject);
            stream.on('finish', resolve);
            stream.write('[\n');
            data.forEach((entry, index) => {
                stream.write(JSON.stringify(entry));
                if (index !== data.length - 1)
                    stream.write(',');
                stream.write('\n');
            });
            stream.write(']\n');
            stream.end();
        });
    }
    overwriteCredentialsProperties() {
        const { credentials } = this.loadNodesAndCredentials.types;
        const credentialsOverwrites = this.credentialsOverwrites.getAll();
        const { showScopes = [], skipTypes } = this.globalConfig.credentials.overwrite;
        for (const credential of credentials) {
            delete credential.__overwrittenProperties;
            delete credential.__skipManagedCreation;
            delete credential.__showManagedOAuthScopes;
            const overwrittenProperties = [];
            this.credentialTypes
                .getParentTypes(credential.name)
                .reverse()
                .map((name) => credentialsOverwrites[name])
                .forEach((overwrite) => {
                if (overwrite)
                    overwrittenProperties.push(...Object.keys(overwrite));
            });
            if (credential.name in credentialsOverwrites) {
                overwrittenProperties.push(...Object.keys(credentialsOverwrites[credential.name]));
            }
            if (overwrittenProperties.length) {
                credential.__overwrittenProperties = (0, uniq_1.default)(overwrittenProperties);
            }
            if (skipTypes.includes(credential.name)) {
                credential.__skipManagedCreation = true;
            }
            if (showScopes.includes(credential.name)) {
                credential.__showManagedOAuthScopes = true;
            }
            const isOAuth2Credential = credential.name === 'oAuth2Api' ||
                this.credentialTypes.getParentTypes(credential.name).includes('oAuth2Api');
            if (isOAuth2Credential && credential.properties) {
                const jwksUri = this.urlService.getInstanceJwksUri();
                credential.properties = credential.properties.map((property) => property.name === 'jwksUri' ? { ...property, default: jwksUri } : property);
            }
        }
    }
};
exports.FrontendService = FrontendService;
exports.FrontendService = FrontendService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig, backend_common_1.Logger, load_nodes_and_credentials_1.LoadNodesAndCredentials, credential_types_1.CredentialTypes, credentials_overwrites_1.CredentialsOverwrites, license_1.License, email_1.UserManagementMailer, n8n_core_1.InstanceSettings, backend_services_1.UrlService, config_1.SecurityConfig, push_config_1.PushConfig, n8n_core_1.BinaryDataConfig, backend_common_1.LicenseState, backend_common_1.ModuleRegistry, mfa_service_1.MfaService, ownership_service_1.OwnershipService, ai_usage_service_1.AiUsageService, db_1.WorkflowRepository, workflow_review_policy_service_1.WorkflowReviewPolicyService, inbox_service_1.InboxService])
], FrontendService);
//# sourceMappingURL=frontend.service.js.map