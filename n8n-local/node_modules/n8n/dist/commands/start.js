"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Start = void 0;
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const core_1 = require("@n8n/n8n-nodes-langchain/mcp/core");
const sleep_1 = require("@n8n/utils/sleep");
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const replacestream_1 = __importDefault(require("replacestream"));
const promises_2 = require("stream/promises");
const zod_1 = require("zod");
const active_executions_1 = require("../active-executions");
const active_workflow_manager_1 = require("../active-workflow-manager");
const config_1 = __importDefault(require("../config"));
const constants_2 = require("../constants");
const credentials_overwrites_1 = require("../credentials-overwrites");
const deprecation_service_1 = require("../deprecation/deprecation.service");
const feature_not_licensed_error_1 = require("../errors/feature-not-licensed.error");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const multi_main_setup_ee_1 = require("../scaling/multi-main-setup.ee");
const publisher_service_1 = require("../scaling/pubsub/publisher.service");
const pubsub_registry_1 = require("../scaling/pubsub/pubsub.registry");
const subscriber_service_1 = require("../scaling/pubsub/subscriber.service");
const durable_scheduler_1 = require("../scheduling/durable-scheduler");
const poll_job_provider_1 = require("../scheduling/poll-trigger-node/poll-job-provider");
const main_system_tasks_1 = require("../scheduling/system-tasks/main-system-tasks");
const server_1 = require("../server");
const wait_tracker_1 = require("../wait-tracker");
const base_command_1 = require("./base-command");
const open = require('open');
const flagsSchema = zod_1.z.object({
    open: zod_1.z.boolean().alias('o').describe('opens the UI automatically in browser').optional(),
});
let Start = class Start extends base_command_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.server = di_1.Container.get(server_1.Server);
        this.needsCommunityPackages = true;
        this.needsExpressionEngine = true;
        this.needsTaskRunner = true;
        this.seedsInstanceIdentity = true;
        this.isMainServer = true;
        this.getEditorUrl = () => di_1.Container.get(backend_services_1.UrlService).getInstanceBaseUrl();
    }
    openBrowser() {
        const editorUrl = this.getEditorUrl();
        open(editorUrl, { wait: true }).catch(() => {
            this.logger.info(`\nWas not able to open URL in browser. Please open manually by visiting:\n${editorUrl}\n`);
        });
    }
    async stopProcess() {
        this.logger.info('\nStopping n8n...');
        try {
            this.activeWorkflowManager.removeAllQueuedWorkflowActivations();
            di_1.Container.get(wait_tracker_1.WaitTracker).stopTracking();
            await this.externalHooks?.run('n8n.stop');
            await this.activeWorkflowManager.removeAllNonWebhookTriggerWorkflows();
            if (this.instanceSettings.isMultiMain) {
                await di_1.Container.get(multi_main_setup_ee_1.MultiMainSetup).shutdown();
            }
            if (this.globalConfig.executions.mode === 'queue') {
                di_1.Container.get(publisher_service_1.Publisher).shutdown();
                di_1.Container.get(subscriber_service_1.Subscriber).shutdown();
            }
            di_1.Container.get(backend_services_1.EventService).emit('instance-stopped');
            await di_1.Container.get(active_executions_1.ActiveExecutions).shutdown();
            await di_1.Container.get(message_event_bus_1.MessageEventBus).close();
        }
        catch (error) {
            await this.exitWithCrash('There was an error shutting down n8n.', error);
        }
        await this.exitSuccessFully();
    }
    generateConfigTags() {
        const frontendSentryConfig = JSON.stringify({
            dsn: this.globalConfig.sentry.frontendDsn,
            environment: process.env.ENVIRONMENT || 'development',
            serverName: process.env.DEPLOYMENT_NAME,
            release: `n8n@${constants_2.N8N_VERSION}`,
        });
        const b64Encode = (value) => Buffer.from(value).toString('base64');
        const restEndpointEncoded = b64Encode(this.globalConfig.endpoints.rest);
        const sentryConfigEncoded = b64Encode(frontendSentryConfig);
        const configMetaTags = [
            `<meta name="n8n:config:rest-endpoint" content="${restEndpointEncoded}">`,
            `<meta name="n8n:config:sentry" content="${sentryConfigEncoded}">`,
        ].join('');
        return configMetaTags;
    }
    async generateStaticAssets() {
        const n8nPath = this.globalConfig.path;
        const hooksUrls = this.globalConfig.externalFrontendHooksUrls;
        let scriptsString = '';
        if (hooksUrls) {
            scriptsString = hooksUrls.split(';').reduce((acc, curr) => {
                return `${acc}<script nonce="${constants_1.HTML_NONCE_PLACEHOLDER}" src="${curr}"></script>`;
            }, '');
        }
        const closingTitleTag = '</title>';
        const { staticCacheDir } = this.instanceSettings;
        const compileFile = async (fileName) => {
            const filePath = path_1.default.join(constants_2.EDITOR_UI_DIST_DIR, fileName);
            if (/(index\.html)|.*\.(js|css)/.test(filePath) && (0, fs_1.existsSync)(filePath)) {
                const destFile = path_1.default.join(staticCacheDir, fileName);
                await (0, promises_1.mkdir)(path_1.default.dirname(destFile), { recursive: true });
                const streams = [
                    (0, fs_1.createReadStream)(filePath, 'utf-8'),
                    (0, replacestream_1.default)('%CONFIG_TAGS%', this.generateConfigTags(), { ignoreCase: false }),
                    (0, replacestream_1.default)('/{{BASE_PATH}}/', n8nPath, { ignoreCase: false }),
                    (0, replacestream_1.default)('/%7B%7BBASE_PATH%7D%7D/', n8nPath, { ignoreCase: false }),
                    (0, replacestream_1.default)('/%257B%257BBASE_PATH%257D%257D/', n8nPath, { ignoreCase: false }),
                ];
                if (filePath.endsWith('index.html')) {
                    streams.push((0, replacestream_1.default)('{{REST_ENDPOINT}}', this.globalConfig.endpoints.rest, {
                        ignoreCase: false,
                    }), (0, replacestream_1.default)(closingTitleTag, closingTitleTag + scriptsString, {
                        ignoreCase: false,
                    }));
                }
                streams.push((0, fs_1.createWriteStream)(destFile, 'utf-8'));
                return await (0, promises_2.pipeline)(streams);
            }
        };
        const files = await (0, fast_glob_1.default)('**/*.{css,js}', { cwd: constants_2.EDITOR_UI_DIST_DIR });
        await Promise.all([compileFile('index.html'), ...files.map(compileFile)]);
    }
    async init() {
        await this.initCrashJournal();
        this.logger.info('Initializing n8n process');
        if (this.globalConfig.executions.mode === 'queue') {
            const scopedLogger = this.logger.scoped('scaling');
            scopedLogger.debug('Starting main instance in scaling mode');
            scopedLogger.debug(`Host ID: ${this.instanceSettings.hostId}`);
            if (process.env.OFFLOAD_MANUAL_EXECUTIONS_TO_WORKERS === 'true') {
                this.needsTaskRunner = false;
            }
        }
        await super.init();
        di_1.Container.get(deprecation_service_1.DeprecationService).warn();
        di_1.Container.get(poll_job_provider_1.PollJobProvider).init();
        this.activeWorkflowManager = di_1.Container.get(active_workflow_manager_1.ActiveWorkflowManager);
        const isMultiMainEnabled = this.globalConfig.executions.mode === 'queue' && this.globalConfig.multiMainSetup.enabled;
        this.instanceSettings.setMultiMainEnabled(isMultiMainEnabled);
        if (isMultiMainEnabled)
            this.instanceSettings.setMultiMainLicensed(true);
        if (this.globalConfig.executions.mode === 'regular') {
            this.instanceSettings.markAsLeader();
        }
        else {
            await this.initOrchestration();
        }
        await di_1.Container.get(backend_services_1.JwtService).initialize(di_1.Container.get(db_1.DeploymentKeyRepository));
        await di_1.Container.get(n8n_core_1.BinaryDataConfig).initialize(di_1.Container.get(db_1.DeploymentKeyRepository));
        await this.initLicense();
        if (isMultiMainEnabled) {
            await this.ensureMultiMainLicensed();
        }
        await this.initCommunityPackages();
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        if (this.instanceSettings.instanceType === 'main') {
            await di_1.Container.get(db_1.AuthRolesService).init();
            this.logger.debug('Auth roles service init complete');
            await di_1.Container.get(backend_services_1.RoleCacheService).refreshCache();
            this.logger.debug('Role cache refreshed');
            await this.initInstanceSettingsLoader();
            this.logger.debug('Instance settings loader init complete');
        }
        await this.initBinaryDataService();
        this.logger.debug('Binary data service init complete');
        di_1.Container.get(wait_tracker_1.WaitTracker).init();
        this.logger.debug('Wait tracker init complete');
        await di_1.Container.get(credentials_overwrites_1.CredentialsOverwrites).init();
        this.logger.debug('Credentials overwrites init complete');
        await this.initDataDeduplicationService();
        this.logger.debug('Data deduplication service init complete');
        await this.initExternalHooks();
        this.logger.debug('External hooks init complete');
        if (!isMultiMainEnabled) {
            await this.cleanupTestRunner();
            this.logger.debug('Test runner cleanup complete');
        }
        if (!this.globalConfig.endpoints.disableUi) {
            await this.generateStaticAssets();
        }
        await this.moduleRegistry.initModules(this.instanceSettings.instanceType);
        const { AuthHandlerRegistry } = await import('../auth/auth-handler.registry.js');
        await di_1.Container.get(AuthHandlerRegistry).init();
        if (this.instanceSettings.isMultiMain) {
            di_1.Container.get(multi_main_setup_ee_1.MultiMainSetup).registerEventHandlers();
        }
        await this.executionContextHookRegistry.init();
        await di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).postProcessLoaders();
    }
    async initInstanceSettingsLoader() {
        const { InstanceSettingsLoaderService } = await import('../instance-settings-loader/instance-settings-loader.service.js');
        await di_1.Container.get(InstanceSettingsLoaderService).init();
    }
    async initOrchestration() {
        di_1.Container.get(publisher_service_1.Publisher);
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        const subscriber = di_1.Container.get(subscriber_service_1.Subscriber);
        await subscriber.subscribe(subscriber.getCommandChannel());
        await subscriber.subscribe(subscriber.getWorkerResponseChannel());
        await subscriber.subscribe(subscriber.getMcpRelayChannel());
        subscriber.setMcpRelayHandler((msg) => {
            try {
                const mcpServer = core_1.McpServer.instance(this.logger);
                mcpServer.handleWorkerResponse(msg.sessionId, msg.messageId, msg.response);
            }
            catch (error) {
                this.logger.error('Failed to handle MCP relay message', {
                    sessionId: msg.sessionId,
                    messageId: msg.messageId,
                    error: error instanceof Error ? error.message : String(error),
                });
            }
        });
        if (this.instanceSettings.isMultiMain) {
            await di_1.Container.get(multi_main_setup_ee_1.MultiMainSetup).init();
        }
        else {
            this.instanceSettings.markAsLeader();
        }
    }
    async ensureMultiMainLicensed() {
        if (this.license.isMultiMainLicensed())
            return;
        if (!this.instanceSettings.isLeader) {
            const maxRetries = 5;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                const delayMs = 2 ** attempt * 1000;
                this.logger.warn(`Instance not licensed for multi-main — retrying license check in ${delayMs / 1000}s (attempt ${attempt}/${maxRetries})`);
                await (0, sleep_1.sleep)(delayMs);
                await this.license.reload();
                if (this.license.isMultiMainLicensed())
                    return;
            }
        }
        throw new feature_not_licensed_error_1.FeatureNotLicensedError(constants_1.LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES, {
            extra: {
                instance: {
                    type: this.instanceSettings.instanceType,
                    isLeader: this.instanceSettings.isLeader,
                },
                config: {
                    autoRenewalEnabled: this.globalConfig.license?.autoRenewalEnabled,
                    activationKeySet: !!this.globalConfig.license?.activationKey,
                    usingEphemeralCert: !!this.globalConfig.license?.cert,
                },
                cert: {
                    exists: (await this.license.loadCertStr()).length > 0,
                    isValid: this.license.isCertValid(),
                    hasMultiMain: this.license.hasFeatureInCert(constants_1.LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES),
                    expiresAt: this.license.getExpiryDate()?.toISOString() ?? null,
                    terminatesAt: this.license.getTerminationDate()?.toISOString() ?? null,
                    consumerId: this.license.getConsumerId(),
                },
            },
        });
    }
    async run() {
        const { flags } = this;
        const databaseSettings = await di_1.Container.get(db_1.SettingsRepository).findBy({
            loadOnStartup: true,
        });
        databaseSettings.forEach((setting) => {
            config_1.default.set(setting.key, (0, n8n_workflow_1.jsonParse)(setting.value, { fallbackValue: setting.value }));
        });
        const { type: dbType } = this.globalConfig.database;
        if (dbType === 'sqlite') {
            const shouldRunVacuum = this.globalConfig.database.sqlite.executeVacuumOnStartup;
            if (shouldRunVacuum) {
                await di_1.Container.get(db_1.ExecutionRepository).query('VACUUM;');
            }
        }
        await this.server.start();
        await this.initSystemTasks(await (0, main_system_tasks_1.mainSystemTasks)(this.globalConfig));
        di_1.Container.get(durable_scheduler_1.DurableScheduler).start();
        if (this.globalConfig.executions.mode === 'regular') {
            const { EnqueuedExecutionRecoveryService } = await import('../executions/enqueued-execution-recovery.service.js');
            await di_1.Container.get(EnqueuedExecutionRecoveryService).recoverEnqueuedExecutions();
        }
        if (this.globalConfig.workflows.useWorkflowPublicationService) {
            const { WorkflowPublicationOutboxConsumer } = await import('../workflows/publication/workflow-publication-outbox-consumer.js');
            const { WorkflowPublicationReconciler } = await import('../workflows/publication/workflow-publication-reconciler.service.js');
            await import('../workflows/publication/published-workflow-trigger-deactivator.js');
            di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
            void di_1.Container.get(WorkflowPublicationOutboxConsumer)
                .init()
                .catch((error) => {
                this.errorReporter.error(error, { shouldBeLogged: true });
            });
            di_1.Container.get(WorkflowPublicationReconciler).init();
        }
        else {
            await this.activeWorkflowManager.init();
        }
        di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).releaseTypes();
        const editorUrl = this.getEditorUrl();
        this.log(`\nEditor is now accessible via:\n${editorUrl}`);
        if (Boolean(process.stdout.isTTY) && process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            if (flags.open) {
                this.openBrowser();
            }
            this.log('\nPress "o" to open in Browser.');
            process.stdin.on('data', (key) => {
                if (key === 'o') {
                    this.openBrowser();
                }
                else if (key.charCodeAt(0) === 3) {
                    void this.onTerminationSignal('SIGINT')();
                }
                else {
                    if (key.charCodeAt(0) === 13) {
                        process.stdout.write('\n');
                    }
                    else {
                        process.stdout.write(key);
                    }
                }
            });
        }
    }
    async catch(error) {
        if (error.stack)
            this.logger.error(error.stack);
        await this.exitWithCrash('Exiting due to an error.', error);
    }
};
exports.Start = Start;
exports.Start = Start = __decorate([
    (0, decorators_1.Command)({
        name: 'start',
        description: 'Starts n8n. Makes Web-UI available and starts active workflows',
        examples: ['', '-o'],
        flagsSchema,
    })
], Start);
//# sourceMappingURL=start.js.map