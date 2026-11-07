"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Server = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_1 = __importDefault(require("express"));
const promises_1 = require("fs/promises");
const helmet_1 = __importDefault(require("helmet"));
const n8n_core_1 = require("n8n-core");
const path_1 = require("path");
const abstract_server_1 = require("./abstract-server");
const auth_service_1 = require("./auth/auth.service");
const constants_2 = require("./constants");
const controller_registry_1 = require("./controller.registry");
const credentials_overwrites_1 = require("./credentials-overwrites");
const message_event_bus_1 = require("./eventbus/message-event-bus/message-event-bus");
const log_streaming_event_relay_1 = require("./events/relays/log-streaming.event-relay");
const load_nodes_and_credentials_1 = require("./load-nodes-and-credentials");
const helpers_1 = require("./mfa/helpers");
const content_security_policy_1 = require("./middlewares/content-security-policy");
const posthog_1 = require("./posthog");
const public_api_1 = require("./public-api");
const push_1 = require("./push");
const ResponseHelper = __importStar(require("./response-helper"));
const content_security_policy_2 = require("./security/content-security-policy");
const telemetry_1 = require("./telemetry");
const requestPath = __importStar(require("./utils/request-path"));
require("./controllers/active-workflows.controller");
require("./controllers/annotation-tags.controller.ee");
require("./controllers/auth.controller");
require("./controllers/binary-data.controller");
require("./controllers/change-email.controller");
require("./controllers/ai.controller");
require("./controllers/ai-preference.controller");
require("./controllers/dynamic-node-parameters.controller");
require("./controllers/invitation.controller");
require("./controllers/me.controller");
require("./controllers/node-types.controller");
require("./controllers/oauth/oauth1-credential.controller");
require("./controllers/oauth/oauth2-credential.controller");
require("./controllers/orchestration.controller");
require("./controllers/owner.controller");
require("./controllers/password-reset.controller");
require("./controllers/project.controller");
require("./controllers/project-pool-settings.controller.ee");
require("./controllers/role.controller");
require("./controllers/tags.controller");
require("./controllers/translation.controller");
require("./controllers/folder.controller");
require("./controllers/users.controller");
require("./controllers/user-settings.controller");
require("./controllers/workflow-statistics.controller");
require("./controllers/api-keys.controller");
require("./controllers/security-settings.controller");
require("./credentials/credentials.controller");
require("./credentials/credential-options.controller");
require("./events/events.controller");
require("./executions/executions.controller");
require("./node-execution/ephemeral-node-executor");
require("./jwks/jwks.controller");
require("./license/license.controller");
require("./evaluation.ee/test-runs.controller.ee");
require("./evaluation.ee/evaluation-config.controller");
require("./evaluation.ee/evaluation-collections.controller.ee");
require("./evaluation.ee/insights/eval-insights.controller.ee");
require("./workflows/workflow-history/workflow-history.controller");
require("./workflows/workflows.controller");
require("./modules/workflow-index/workflow-dependency.controller");
require("./webhooks/test-webhooks.controller");
require("./webhooks/webhooks.controller");
const chat_server_1 = require("./chat/chat-server");
const mfa_service_1 = require("./mfa/mfa.service");
const browser_use_server_1 = require("./modules/instance-ai/browser/browser-use-server");
const pubsub_registry_1 = require("./scaling/pubsub/pubsub.registry");
const api_key_auth_strategy_1 = require("./services/api-key-auth.strategy");
const session_cookie_auth_strategy_1 = require("./services/session-cookie-auth.strategy");
let Server = class Server extends abstract_server_1.AbstractServer {
    constructor(loadNodesAndCredentials, postHogClient, eventService, instanceSettings) {
        super();
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.postHogClient = postHogClient;
        this.eventService = eventService;
        this.instanceSettings = instanceSettings;
        this.testWebhooksEnabled = true;
        this.webhooksEnabled = !this.globalConfig.endpoints.disableProductionWebhooksOnMainProcess;
    }
    async start() {
        if (!this.globalConfig.endpoints.disableUi) {
            const { FrontendService } = await import('./services/frontend.service.js');
            this.frontendService = di_1.Container.get(FrontendService);
            await import('./controllers/module-settings.controller.js');
            await import('./controllers/third-party-licenses.controller.js');
        }
        this.presetCredentialsLoaded = false;
        this.endpointPresetCredentials = this.globalConfig.credentials.overwrite.endpoint;
        await super.start();
        this.logger.debug(`Server ID: ${this.instanceSettings.hostId}`);
        if (process.env.N8N_DEV_RELOAD === 'true') {
            void this.loadNodesAndCredentials.setupHotReload();
        }
        this.markAsReady();
        this.eventService.emit('server-started');
    }
    async registerAdditionalControllers() {
        if (!backend_common_1.inProduction && this.instanceSettings.isMultiMain) {
            await import('./controllers/debug.controller.js');
        }
        if (constants_2.inE2ETests) {
            await import('./controllers/e2e.controller.js');
        }
        if (process.env.N8N_DEV_RELOAD === 'true') {
            await import('./controllers/dev.controller.js');
        }
        if ((0, helpers_1.isMfaFeatureEnabled)()) {
            await di_1.Container.get(mfa_service_1.MfaService).init();
            await import('./controllers/mfa.controller.js');
        }
        if (!this.globalConfig.endpoints.disableUi) {
            await import('./controllers/cta.controller.js');
        }
        if (!this.globalConfig.tags.disabled) {
            await import('./controllers/tags.controller.js');
        }
        if (this.globalConfig.diagnostics.enabled) {
            await import('./controllers/telemetry.controller.js');
            await import('./controllers/posthog.controller.js');
        }
        try {
            await import('./environments.ee/variables/variables.controller.ee.js');
        }
        catch (error) {
            this.logger.warn(`Variables initialization failed: ${error.message}`);
        }
    }
    async configure() {
        if (this.globalConfig.endpoints.metrics.enable) {
            const { PrometheusMetricsService } = await import('./metrics/prometheus/index.js');
            di_1.Container.get(PrometheusMetricsService).init(this.app);
        }
        const { frontendService } = this;
        if (frontendService) {
            const frontendSettings = await frontendService.getSettings();
            await this.externalHooks.run('frontend.settings', [frontendSettings]);
            if (this.globalConfig.deployment.type === 'cloud') {
                di_1.Container.get(telemetry_1.Telemetry).setUserCloudId(frontendSettings.n8nMetadata?.userId);
            }
        }
        await this.postHogClient.init();
        this.postHogClient.setupExpressSessionContext(this.app);
        const publicApiEndpoint = this.globalConfig.publicApi.path;
        const registry = di_1.Container.get(auth_1.AuthStrategyRegistry);
        registry.register(di_1.Container.get(api_key_auth_strategy_1.ApiKeyAuthStrategy));
        registry.register(di_1.Container.get(session_cookie_auth_strategy_1.SessionCookieAuthStrategy));
        this.app.use((0, cookie_parser_1.default)());
        this.app.use((req, _, next) => {
            req.browserId = req.headers['browser-id'];
            next();
        });
        const securityConfig = di_1.Container.get(config_1.SecurityConfig);
        this.app.use((0, content_security_policy_1.createContentSecurityPolicyMiddleware)((0, content_security_policy_2.resolveContentSecurityPolicies)(securityConfig.contentSecurityPolicy, securityConfig.contentSecurityPolicyReportOnly, this.logger)));
        const { apiRouters, apiLatestVersion } = await (0, public_api_1.loadPublicApiVersions)(publicApiEndpoint);
        this.app.use(...apiRouters);
        if (frontendService) {
            (await frontendService.getSettings()).publicApi.latestVersion = apiLatestVersion;
        }
        const { restEndpoint, app } = this;
        const push = di_1.Container.get(push_1.Push);
        push.setupPushHandler(restEndpoint, app);
        if (push.isBidirectional) {
            const { CollaborationService } = await import('./collaboration/collaboration.service.js');
            const collaborationService = di_1.Container.get(CollaborationService);
            collaborationService.init();
        }
        else {
            this.logger.warn('Collaboration features are disabled because push is configured unidirectional. Use N8N_PUSH_BACKEND=websocket environment variable to enable them.');
        }
        if (this.globalConfig.executions.mode === 'queue') {
            const { ScalingService } = await import('./scaling/scaling.service.js');
            await di_1.Container.get(ScalingService).setupQueue();
        }
        await (0, helpers_1.handleMfaDisable)();
        await this.registerAdditionalControllers();
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        di_1.Container.get(controller_registry_1.ControllerRegistry).activate(app);
        const tzDataFile = (0, path_1.resolve)(constants_2.CLI_DIR, 'dist/timezones.json');
        this.app.get(`/${this.restEndpoint}/options/timezones`, (_, res) => res.sendFile(tzDataFile, { dotfiles: 'allow' }));
        this.configureSettingsRoute();
        const eventBus = di_1.Container.get(message_event_bus_1.MessageEventBus);
        await eventBus.initialize();
        di_1.Container.get(log_streaming_event_relay_1.LogStreamingEventRelay).init();
        await this.initializeWorkflowIndexing();
        if (this.endpointPresetCredentials !== '') {
            const overwriteEndpointMiddleware = di_1.Container.get(credentials_overwrites_1.CredentialsOverwrites).getOverwriteEndpointMiddleware();
            if (overwriteEndpointMiddleware) {
                this.app.use(`/${this.endpointPresetCredentials}`, overwriteEndpointMiddleware);
            }
            const authenticationEnforced = overwriteEndpointMiddleware !== null;
            this.app.post(`/${this.endpointPresetCredentials}`, async (req, res) => {
                try {
                    if (!this.presetCredentialsLoaded || authenticationEnforced) {
                        const body = req.body;
                        if (req.contentType !== 'application/json') {
                            ResponseHelper.sendErrorResponse(res, new Error('Body must be a valid JSON, make sure the content-type is application/json'));
                            return;
                        }
                        await di_1.Container.get(credentials_overwrites_1.CredentialsOverwrites).setData(body, true, true);
                        this.presetCredentialsLoaded = true;
                        di_1.Container.get(push_1.Push).broadcast({ type: 'nodeDescriptionUpdated', data: {} });
                        ResponseHelper.sendSuccessResponse(res, { success: true }, true, 200);
                    }
                    else {
                        ResponseHelper.sendErrorResponse(res, new Error('Preset credentials can be set once'));
                    }
                }
                catch (error) {
                    this.logger.error('Error handling credentials overwrite', { error });
                    ResponseHelper.sendErrorResponse(res, new Error('An error occurred while handling credentials overwrite, please check the logs for more details'));
                }
            });
        }
        const maxAge = constants_1.Time.days.toMilliseconds;
        const cacheOptions = constants_2.inE2ETests || backend_common_1.inDevelopment ? {} : { maxAge };
        const { staticCacheDir } = di_1.Container.get(n8n_core_1.InstanceSettings);
        this.protectTypeFiles(staticCacheDir);
        if (frontendService) {
            const assetAuthMiddleware = di_1.Container.get(auth_service_1.AuthService).createAssetAuthMiddleware();
            const registerAuthenticatedRoutes = (paths, handler) => {
                for (const assetPath of paths) {
                    this.app.get(assetPath, assetAuthMiddleware, handler);
                }
            };
            const respondWithPrivateFile = (res, filePath, assetMaxAge = 0) => {
                const maxAgeSeconds = Math.floor(assetMaxAge * constants_1.Time.milliseconds.toSeconds);
                res.setHeader('Cache-Control', `private, max-age=${maxAgeSeconds}`);
                return res.sendFile(filePath, { maxAge: assetMaxAge, dotfiles: 'allow' });
            };
            registerAuthenticatedRoutes([
                '/icons/{@:scope/}:packageName/*path/*file.svg',
                '/icons/{@:scope/}:packageName/*path/*file.png',
            ], async (req, res) => {
                let { scope, packageName } = req.params;
                if (scope)
                    packageName = `@${scope}/${packageName}`;
                const filePath = this.loadNodesAndCredentials.resolveIcon(packageName, req.originalUrl);
                if (filePath) {
                    try {
                        await (0, promises_1.access)(filePath);
                        return respondWithPrivateFile(res, filePath, maxAge);
                    }
                    catch { }
                }
                res.sendStatus(404);
            });
            const serveSchemas = async (req, res) => {
                const { node, version, resource, operation } = req.params;
                const filePath = this.loadNodesAndCredentials.resolveSchema({
                    node,
                    resource,
                    operation,
                    version,
                });
                if (filePath) {
                    try {
                        await (0, promises_1.access)(filePath);
                        return respondWithPrivateFile(res, filePath, cacheOptions.maxAge);
                    }
                    catch { }
                }
                res.sendStatus(404);
            };
            registerAuthenticatedRoutes(['/schemas/:node/:version{/:resource}{/:operation}.json'], serveSchemas);
            const isTLSEnabled = this.globalConfig.protocol === 'https' && !!(this.sslKey && this.sslCert);
            const isPreviewMode = process.env.N8N_PREVIEW_MODE === 'true';
            const crossOriginOpenerPolicy = di_1.Container.get(config_1.SecurityConfig).crossOriginOpenerPolicy;
            const securityHeadersMiddleware = (0, helmet_1.default)({
                contentSecurityPolicy: false,
                xFrameOptions: isPreviewMode || constants_2.inE2ETests || backend_common_1.inDevelopment ? false : { action: 'sameorigin' },
                dnsPrefetchControl: false,
                ieNoOpen: false,
                xPoweredBy: false,
                strictTransportSecurity: isTLSEnabled
                    ? {
                        maxAge: 180 * constants_1.Time.days.toSeconds,
                        includeSubDomains: false,
                        preload: false,
                    }
                    : false,
                crossOriginOpenerPolicy: {
                    policy: crossOriginOpenerPolicy,
                },
            });
            const nonUIRoutes = [
                'favicon.ico',
                'assets',
                'static',
                'types',
                '\\.well-known',
                this.endpointHealth,
                'metrics',
                'e2e',
                this.restEndpoint,
                this.endpointPresetCredentials,
                ...this.globalConfig.endpoints.additionalNonUIRoutes.split(':'),
            ].filter((u) => !!u);
            const nonUIRoutesRegex = new RegExp(`^/(${nonUIRoutes.join('|')})/?.*$`, 'i');
            let indexHtmlParts;
            const indexHtmlTemplate = async () => {
                indexHtmlParts ??= (await (0, promises_1.readFile)((0, path_1.resolve)(staticCacheDir, 'index.html'), 'utf8')).split(constants_1.HTML_NONCE_PLACEHOLDER);
                return indexHtmlParts;
            };
            const historyApiHandler = async (req, res, next) => {
                const { method, headers: { accept }, } = req;
                if (method === 'GET' &&
                    (!accept || req.accepts('html') || accept.includes('*/*')) &&
                    !req.path.endsWith('.wasm') &&
                    !nonUIRoutesRegex.test(requestPath.normalize(req.path))) {
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, proxy-revalidate');
                    let template;
                    try {
                        template = await indexHtmlTemplate();
                    }
                    catch (error) {
                        this.logger.error('Could not read index.html', { error });
                        res.sendStatus(500);
                        return;
                    }
                    securityHeadersMiddleware(req, res, () => {
                        res.type('html').send(template.join(res.locals.cspNonce));
                    });
                }
                else {
                    next();
                }
            };
            this.app.use('/', historyApiHandler, express_1.default.static(staticCacheDir, cacheOptions), express_1.default.static(constants_2.EDITOR_UI_DIST_DIR, cacheOptions));
        }
        else {
            this.app.use('/', express_1.default.static(staticCacheDir, cacheOptions));
        }
    }
    protectTypeFiles(staticCacheDir) {
        const authMiddleware = di_1.Container.get(auth_service_1.AuthService).createAuthMiddleware({
            allowSkipMFA: true,
            allowSkipPreviewAuth: true,
        });
        const typeFiles = ['/types/nodes.json', '/types/credentials.json', '/types/node-versions.json'];
        typeFiles.forEach((typeFile) => {
            this.app.get(typeFile, authMiddleware, async (_, res) => {
                res.setHeader('Cache-Control', 'no-cache, must-revalidate');
                res.sendFile(typeFile.substring(1), { root: staticCacheDir });
            });
        });
        this.app.use((req, res, next) => {
            if (requestPath.mayReachDirectory(req.path, 'types')) {
                res.status(401).end();
                return;
            }
            next();
        });
    }
    configureSettingsRoute() {
        const { frontendService } = this;
        const authService = di_1.Container.get(auth_service_1.AuthService);
        if (frontendService) {
            this.app.get(`/${this.restEndpoint}/settings`, authService.createAuthMiddleware({ allowSkipMFA: false, allowUnauthenticated: true }), ResponseHelper.send(async (req) => {
                return req.user
                    ? await frontendService.getSettings()
                    : await frontendService.getPublicSettings(!!req.authInfo?.mfaEnrollmentRequired);
            }));
        }
    }
    async initializeWorkflowIndexing() {
        const { WorkflowIndexService } = await import('./modules/workflow-index/workflow-index.service.js');
        di_1.Container.get(WorkflowIndexService).init();
    }
    setupPushServer() {
        const { restEndpoint, server, app } = this;
        di_1.Container.get(push_1.Push).setupPushServer(restEndpoint, server, app);
        di_1.Container.get(chat_server_1.ChatServer).setup(server, app);
        if (di_1.Container.get(backend_common_1.ModuleRegistry).isActive('instance-ai')) {
            di_1.Container.get(browser_use_server_1.BrowserUseServer).setup(server, app);
        }
    }
};
exports.Server = Server;
exports.Server = Server = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [load_nodes_and_credentials_1.LoadNodesAndCredentials, posthog_1.PostHogClient, backend_services_1.EventService, n8n_core_1.InstanceSettings])
], Server);
//# sourceMappingURL=server.js.map