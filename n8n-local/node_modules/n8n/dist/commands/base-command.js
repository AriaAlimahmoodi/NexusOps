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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCommand = void 0;
require("reflect-metadata");
const constants_1 = require("../constants");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const blob_storage_1 = require("@n8n/blob-storage");
const config_1 = require("@n8n/config");
const constants_2 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_core_1 = require("n8n-core");
const sleep_1 = require("@n8n/utils/sleep");
const n8n_workflow_1 = require("n8n-workflow");
const CrashJournal = __importStar(require("../crash-journal"));
const deduplication_1 = require("../deduplication");
const encryption_bootstrap_service_1 = require("../encryption/encryption-bootstrap.service");
const test_run_cleanup_service_ee_1 = require("../evaluation.ee/test-runner/test-run-cleanup.service.ee");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const activity_event_relay_1 = require("../events/relays/activity.event-relay");
const telemetry_event_relay_1 = require("../events/relays/telemetry.event-relay");
const workflow_failure_notification_event_relay_1 = require("../events/relays/workflow-failure-notification.event-relay");
const execution_data_json_store_1 = require("../executions/execution-data/execution-data-json-store");
const expression_observability_provider_1 = require("../expression-observability/expression-observability.provider");
const external_hooks_1 = require("../external-hooks");
const license_1 = require("../license");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const community_packages_config_1 = require("../modules/community-packages/community-packages.config");
const node_types_1 = require("../node-types");
const policy_modules_1 = require("../policy/policy-modules");
const posthog_1 = require("../posthog");
const instance_system_tasks_1 = require("../scheduling/system-tasks/instance-system-tasks");
const shutdown_service_1 = require("../shutdown/shutdown.service");
const health_endpoint_util_1 = require("../utils/health-endpoint.util");
class BaseCommand {
    constructor() {
        this.logger = di_1.Container.get(backend_common_1.Logger);
        this.instanceSettings = di_1.Container.get(n8n_core_1.InstanceSettings);
        this.shutdownService = di_1.Container.get(shutdown_service_1.ShutdownService);
        this.globalConfig = di_1.Container.get(config_1.GlobalConfig);
        this.modulesConfig = di_1.Container.get(backend_common_1.ModulesConfig);
        this.moduleRegistry = di_1.Container.get(backend_common_1.ModuleRegistry);
        this.executionContextHookRegistry = di_1.Container.get(n8n_core_1.ExecutionContextHookRegistry);
        this.gracefulShutdownTimeoutInS = di_1.Container.get(config_1.GlobalConfig).generic.gracefulShutdownTimeout;
        this.needsCommunityPackages = false;
        this.needsDb = true;
        this.needsTaskRunner = false;
        this.needsExpressionEngine = false;
        this.seedsInstanceIdentity = false;
        this.isMainServer = false;
    }
    async init() {
        this.installOutboundProxyAgents();
        this.dbConnection = di_1.Container.get(db_1.DbConnection);
        this.errorReporter = di_1.Container.get(n8n_core_1.ErrorReporter);
        const { backendDsn, environment, deploymentName, profilesSampleRate, tracesSampleRate, tracesSlowSpanThresholdMs, webhookTracesSampleRate, eventLoopBlockThreshold, eventLoopBlockMaxEventsPerHour, eventLoopBlockDetectionEnabled, } = this.globalConfig.sentry;
        await this.errorReporter.init({
            serverType: this.instanceSettings.instanceType,
            dsn: backendDsn,
            environment,
            release: `n8n@${constants_1.N8N_VERSION}`,
            serverName: deploymentName,
            releaseDate: constants_1.N8N_RELEASE_DATE,
            withEventLoopBlockDetection: eventLoopBlockDetectionEnabled,
            eventLoopBlockThreshold,
            eventLoopBlockMaxEventsPerHour,
            tracesSampleRate,
            slowSpanThresholdMs: tracesSlowSpanThresholdMs,
            webhookEndpoint: this.globalConfig.endpoints.webhook,
            webhookTracesSampleRate,
            profilesSampleRate,
            healthEndpoint: (0, health_endpoint_util_1.resolveBackendHealthEndpointPath)(this.globalConfig),
            eligibleIntegrations: {
                Express: true,
                Http: true,
                Postgres: this.globalConfig.database.type === 'postgresdb',
                Redis: this.globalConfig.executions.mode === 'queue' ||
                    this.globalConfig.cache.backend === 'redis',
            },
        });
        process.once('SIGTERM', this.onTerminationSignal('SIGTERM'));
        process.once('SIGINT', this.onTerminationSignal('SIGINT'));
        this.nodeTypes = di_1.Container.get(node_types_1.NodeTypes);
        await di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).init();
        const useRedisForLocking = this.globalConfig.executions.mode === 'queue' ||
            this.globalConfig.multiMainSetup.enabled ||
            this.globalConfig.cache.backend === 'redis';
        if (useRedisForLocking) {
            const { RedisLockService } = await import('../scaling/redis-lock.service.js');
            di_1.Container.get(backend_common_1.LockService).setProvider(di_1.Container.get(RedisLockService));
        }
        if (this.needsDb) {
            await this.dbConnection
                .init()
                .catch(async (error) => await this.exitWithCrash('There was an error initializing DB', error));
            if (backend_common_1.inDevelopment || backend_common_1.inTest) {
                this.shutdownService.validate();
            }
            await this.server?.init();
            await this.dbConnection
                .migrate()
                .catch(async (error) => await this.exitWithCrash('There was an error running database migrations', error));
            try {
                await this.instanceSettings.initialize(di_1.Container.get(db_1.DeploymentKeyRepository), {
                    canSeed: this.seedsInstanceIdentity,
                });
            }
            catch (error) {
                if (this.seedsInstanceIdentity)
                    throw error;
                this.logger.warn('Could not read the instance identity from the DB, using derived values', {
                    error: (0, ensure_error_1.ensureError)(error),
                });
            }
            await di_1.Container.get(encryption_bootstrap_service_1.EncryptionBootstrapService).run();
        }
        if (process.env.EXECUTIONS_PROCESS === 'own')
            process.exit(-1);
        if (this.globalConfig.executions.mode === 'queue' &&
            this.globalConfig.database.type === 'sqlite') {
            this.logger.warn('Scaling mode is not officially supported with sqlite. Please use PostgreSQL instead.');
        }
        const isMultiMainEnabled = this.globalConfig.executions.mode === 'queue' && this.globalConfig.multiMainSetup.enabled;
        this.instanceSettings.setMultiMainEnabled(isMultiMainEnabled);
        this.instanceSettings.setMultiMainLicensed(isMultiMainEnabled);
        const taskRunnersConfig = this.globalConfig.taskRunners;
        if (this.needsTaskRunner) {
            if (taskRunnersConfig.insecureMode) {
                this.logger.warn('TASK RUNNER CONFIGURED TO START IN INSECURE MODE. This is discouraged for production use. Please consider using secure mode instead.');
            }
            const { TaskRunnerModule } = await import('../task-runners/task-runner-module.js');
            await di_1.Container.get(TaskRunnerModule).start();
        }
        di_1.Container.get(message_event_bus_1.MessageEventBus);
        await di_1.Container.get(posthog_1.PostHogClient).init();
        await di_1.Container.get(telemetry_event_relay_1.TelemetryEventRelay).init();
        di_1.Container.get(activity_event_relay_1.ActivityEventRelay).init();
        di_1.Container.get(workflow_failure_notification_event_relay_1.WorkflowFailureNotificationEventRelay).init();
        if (this.needsExpressionEngine) {
            const { engine, poolSize, maxCodeCacheSize, bridgeTimeout, bridgeMemoryLimit, idleTimeout, lazyAcquire, compileCache, nativeEvaluation, nativeEvaluationVerifySample, } = this.globalConfig.expressionEngine;
            const observability = di_1.Container.get(expression_observability_provider_1.ExpressionObservabilityProvider);
            this.logNativeVerifyModeStatus();
            try {
                await n8n_workflow_1.Expression.initExpressionEngine({
                    engine,
                    poolSize,
                    maxCodeCacheSize,
                    bridgeTimeout,
                    bridgeMemoryLimit,
                    idleTimeoutMs: idleTimeout === undefined ? undefined : idleTimeout * 1000,
                    lazyAcquire,
                    compileCache,
                    nativeEvaluation,
                    nativeEvaluationVerifySample,
                    reportNativeVerifyMismatch: this.errorReporter.isSentryActive()
                        ? (mismatch) => this.reportNativeVerifyMismatch(mismatch)
                        : undefined,
                    canReportNativeVerifyMismatch: () => this.errorReporter.isSentryActive(),
                    observability,
                });
            }
            catch (error) {
                await this.exitWithCrash('Could not initialize the vm expression engine (see errors above for details). If they point at isolated-vm, check that it installed correctly, e.g. that native build scripts were not skipped.', error);
            }
        }
        else {
            n8n_workflow_1.Expression.setExpressionEngine(this.globalConfig.expressionEngine.engine);
        }
    }
    logNativeVerifyModeStatus() {
        const { nativeEvaluation, nativeEvaluationVerifySample, engine } = this.globalConfig.expressionEngine;
        if (nativeEvaluationVerifySample > 0) {
            if (nativeEvaluation) {
                this.logger.warn('Native evaluation verify mode does nothing because native evaluation is enabled');
            }
            else if (engine === 'legacy') {
                this.logger.warn('Native evaluation verify mode does nothing because the expression engine is legacy');
            }
            else if (!this.errorReporter.isSentryActive()) {
                this.logger.warn('Native evaluation verify mode does nothing because Sentry is not active');
            }
            else {
                this.logger.info('Native evaluation verify mode is active', {
                    sample: nativeEvaluationVerifySample,
                    engine,
                });
            }
        }
    }
    reportNativeVerifyMismatch({ engine, skeleton, nativeResultType, engineResultType, workflowId, }) {
        this.errorReporter.info('Native evaluation result differs from the expression engine', {
            tags: { expressionEngine: engine },
            extra: { skeleton, nativeResultType, engineResultType, workflowId },
            fingerprint: ['native-evaluation-verify-mismatch', skeleton],
            shouldIsolate: true,
        });
    }
    async initSystemTasks(ownTasks = []) {
        const metadata = di_1.Container.get(decorators_1.SystemTaskMetadata);
        for (const taskClass of [...(await (0, instance_system_tasks_1.instanceSystemTasks)(this.globalConfig)), ...ownTasks]) {
            metadata.register(taskClass);
        }
        const { SystemTaskRunner } = await import('../scheduling/system-tasks/system-task-runner.js');
        await di_1.Container.get(SystemTaskRunner).init();
    }
    installOutboundProxyAgents() {
        if (this.globalConfig.outboundProxy.mode === 'all' || this.isMainServer) {
            (0, backend_network_1.installGlobalProxyAgent)();
        }
    }
    async stopProcess() {
    }
    async initCommunityPackages() {
        const communityPackagesConfig = di_1.Container.get(community_packages_config_1.CommunityPackagesConfig);
        if (communityPackagesConfig.enabled && this.needsCommunityPackages) {
            const { CommunityPackagesService } = await import('../modules/community-packages/community-packages.service.js');
            await di_1.Container.get(CommunityPackagesService).init();
        }
    }
    async initCrashJournal() {
        await CrashJournal.init();
    }
    async exitSuccessFully() {
        try {
            await Promise.all([
                CrashJournal.cleanup(),
                this.dbConnection.close(),
                n8n_workflow_1.Expression.disposeExpressionEngine(),
            ]);
        }
        finally {
            process.exit();
        }
    }
    async exitWithCrash(message, error) {
        this.logger.error(message, { error });
        this.errorReporter.error(new Error(message, { cause: error }), { level: 'fatal' });
        await (0, sleep_1.sleep)(2000);
        process.exit(1);
    }
    log(message) {
        this.logger.info(message);
    }
    error(message) {
        throw new n8n_workflow_1.UnexpectedError(message);
    }
    logError(error, summary) {
        if (summary)
            this.logger.error(summary);
        this.logger.error('\nGOT ERROR');
        this.logger.error('====================================');
        this.logger.error(error.message);
        this.logger.error(error.stack);
    }
    async initBinaryDataService() {
        const binaryDataConfig = di_1.Container.get(n8n_core_1.BinaryDataConfig);
        const binaryDataService = di_1.Container.get(n8n_core_1.BinaryDataService);
        const isS3WriteMode = binaryDataConfig.mode === 's3';
        const isAzureWriteMode = binaryDataConfig.mode === 'azure';
        const { DatabaseManager } = await import('../binary-data/database.manager.js');
        binaryDataService.setManager('database', di_1.Container.get(DatabaseManager));
        if (isS3WriteMode) {
            const isLicensed = di_1.Container.get(license_1.License).isLicensed(constants_2.LICENSE_FEATURES.BINARY_DATA_S3);
            if (!isLicensed) {
                this.logger.error('S3 binary data storage requires a valid license. Either set `N8N_DEFAULT_BINARY_DATA_MODE` to something else, or upgrade to a license that supports this feature.');
                process.exit(1);
            }
        }
        if (isAzureWriteMode) {
            const isLicensed = di_1.Container.get(backend_common_1.LicenseState).isBinaryDataAzureLicensed();
            if (!isLicensed) {
                this.logger.error('Azure Blob binary data storage requires a valid license. Either set `N8N_DEFAULT_BINARY_DATA_MODE` to something else, or upgrade to a license that supports this feature.');
                process.exit(1);
            }
            if (di_1.Container.get(blob_storage_1.AzureBlobConfig).containerName === '') {
                this.logger.error('Azure Blob binary data storage requires `N8N_EXTERNAL_STORAGE_AZURE_CONTAINER_NAME` to be set.');
                process.exit(1);
            }
        }
        const executionDataMode = di_1.Container.get(n8n_core_1.StorageConfig).mode;
        const isS3Configured = di_1.Container.get(blob_storage_1.ObjectStoreConfig).bucket.name !== '';
        const isAzureConfigured = di_1.Container.get(blob_storage_1.AzureBlobConfig).containerName !== '';
        const isExecutionDataS3Mode = executionDataMode === 's3';
        const isExecutionDataAzureMode = executionDataMode === 'azure';
        const isExecutionDataS3Licensed = di_1.Container.get(backend_common_1.LicenseState).isExecutionDataS3Licensed();
        const isExecutionDataAzureLicensed = di_1.Container.get(backend_common_1.LicenseState).isExecutionDataAzureLicensed();
        if (isExecutionDataS3Mode) {
            if (!isExecutionDataS3Licensed) {
                this.logger.error('S3 execution data storage requires a valid license. Either set `N8N_EXECUTION_DATA_STORAGE_MODE` to something else, or upgrade to a license that supports this feature.');
                process.exit(1);
            }
            if (!isS3Configured) {
                this.logger.error('S3 execution data storage requires `N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME` to be set.');
                process.exit(1);
            }
        }
        if (isExecutionDataAzureMode) {
            if (!isExecutionDataAzureLicensed) {
                this.logger.error('Azure Blob execution data storage requires a valid license. Either set `N8N_EXECUTION_DATA_STORAGE_MODE` to something else, or upgrade to a license that supports this feature.');
                process.exit(1);
            }
            if (!isAzureConfigured) {
                this.logger.error('Azure Blob execution data storage requires `N8N_EXTERNAL_STORAGE_AZURE_CONTAINER_NAME` to be set.');
                process.exit(1);
            }
        }
        await this.initBinaryDataBlobManagers({
            s3: isS3WriteMode || isExecutionDataS3Mode,
            azure: isAzureWriteMode || isExecutionDataAzureMode,
        });
        await binaryDataService.init();
    }
    async initBinaryDataBlobManagers(required) {
        const binaryDataService = di_1.Container.get(n8n_core_1.BinaryDataService);
        try {
            const objectStoreService = await this.initObjectStoreIfConfigured();
            if (objectStoreService) {
                binaryDataService.setManager('s3', new n8n_core_1.BinaryDataBlobManager(new blob_storage_1.S3ByteStore(objectStoreService), this.errorReporter));
            }
        }
        catch {
            if (required.s3) {
                this.logger.error('Failed to connect to S3. Please check your S3 configuration.');
                process.exit(1);
            }
        }
        try {
            const azureBlobService = await this.initAzureStoreIfConfigured();
            if (azureBlobService) {
                binaryDataService.setManager('azure', new n8n_core_1.BinaryDataBlobManager(new blob_storage_1.AzureByteStore(azureBlobService), this.errorReporter));
            }
        }
        catch {
            if (required.azure) {
                this.logger.error('Failed to connect to Azure Blob storage. Please check your Azure configuration.');
                process.exit(1);
            }
        }
    }
    async initObjectStoreIfConfigured() {
        if (di_1.Container.get(blob_storage_1.ObjectStoreConfig).bucket.name === '')
            return undefined;
        const { ObjectStoreService } = await import('@n8n/blob-storage/object-store');
        const objectStoreService = di_1.Container.get(ObjectStoreService);
        await objectStoreService.init();
        di_1.Container.get(execution_data_json_store_1.ExecutionDataJsonStore).registerByteStore('s3', new blob_storage_1.S3ByteStore(objectStoreService));
        return objectStoreService;
    }
    async initAzureStoreIfConfigured() {
        if (di_1.Container.get(blob_storage_1.AzureBlobConfig).containerName === '')
            return;
        const { AzureBlobService } = await import('@n8n/blob-storage/azure-blob');
        const azureBlobService = di_1.Container.get(AzureBlobService);
        await azureBlobService.init();
        di_1.Container.get(execution_data_json_store_1.ExecutionDataJsonStore).registerByteStore('az', new blob_storage_1.AzureByteStore(azureBlobService));
        return azureBlobService;
    }
    async initDataDeduplicationService() {
        const dataDeduplicationService = (0, deduplication_1.getDataDeduplicationService)();
        await n8n_core_1.DataDeduplicationService.init(dataDeduplicationService);
    }
    async initExternalHooks() {
        this.externalHooks = di_1.Container.get(external_hooks_1.ExternalHooks);
        await this.externalHooks.init();
    }
    async initLicense() {
        this.license = di_1.Container.get(license_1.License);
        await this.license.init();
        di_1.Container.get(backend_common_1.LicenseState).setLicenseProvider(this.license);
        const { activationKey } = this.globalConfig.license;
        if (activationKey) {
            const hasCert = (await this.license.loadCertStr()).length > 0;
            if (hasCert) {
                return this.logger.debug('Skipping license activation');
            }
            try {
                this.logger.debug('Attempting license activation');
                await this.license.activate(activationKey);
                this.logger.debug('License init complete');
            }
            catch (e) {
                const error = (0, ensure_error_1.ensureError)(e);
                this.logger.error('Could not activate license', { error });
            }
        }
    }
    async initPolicyEnforcement() {
        await this.moduleRegistry.initModules(this.instanceSettings.instanceType, policy_modules_1.POLICY_MODULES);
    }
    async cleanupTestRunner() {
        await di_1.Container.get(test_run_cleanup_service_ee_1.TestRunCleanupService).cleanupIncompleteRuns();
    }
    async finally(error) {
        if (error?.message)
            this.logger.error(error.message);
        if (backend_common_1.inTest || this.constructor.name === 'Start')
            return;
        if (this.dbConnection.connectionState.connected) {
            await (0, sleep_1.sleep)(100);
            await this.dbConnection.close();
        }
        const exitCode = error ? 1 : 0;
        process.exit(exitCode);
    }
    onTerminationSignal(signal) {
        return async () => {
            if (this.shutdownService.isShuttingDown()) {
                this.logger.info(`Received ${signal}. Already shutting down...`);
                return;
            }
            const forceShutdownTimer = setTimeout(async () => {
                this.logger.info(`process exited after ${this.gracefulShutdownTimeoutInS}s`);
                const errorMsg = `Shutdown timed out after ${this.gracefulShutdownTimeoutInS} seconds`;
                await this.exitWithCrash(errorMsg, new Error(errorMsg));
            }, this.gracefulShutdownTimeoutInS * 1000);
            this.logger.info(`Received ${signal}. Shutting down...`);
            this.shutdownService.shutdown();
            await this.shutdownService.waitForShutdown();
            await this.errorReporter.shutdown();
            await this.stopProcess();
            clearTimeout(forceShutdownTimer);
        };
    }
}
exports.BaseCommand = BaseCommand;
//# sourceMappingURL=base-command.js.map