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
exports.Worker = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const zod_1 = require("zod");
const active_executions_1 = require("../active-executions");
const constants_1 = require("../constants");
const credentials_overwrites_1 = require("../credentials-overwrites");
const deprecation_service_1 = require("../deprecation/deprecation.service");
const event_message_generic_1 = require("../eventbus/event-message-classes/event-message-generic");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const log_streaming_event_relay_1 = require("../events/relays/log-streaming.event-relay");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const execution_stop_service_1 = require("../scaling/execution-stop.service");
const publisher_service_1 = require("../scaling/pubsub/publisher.service");
const pubsub_registry_1 = require("../scaling/pubsub/pubsub.registry");
const subscriber_service_1 = require("../scaling/pubsub/subscriber.service");
const queue_name_1 = require("../scaling/queue-name");
const worker_status_service_ee_1 = require("../scaling/worker-status.service.ee");
const backend_services_1 = require("@n8n/backend-services");
const base_command_1 = require("./base-command");
const flagsSchema = zod_1.z.object({
    concurrency: zod_1.z.number().int().default(10).describe('How many jobs can run in parallel.'),
});
let Worker = class Worker extends base_command_1.BaseCommand {
    async stopProcess() {
        this.logger.info('Stopping worker...');
        try {
            await this.externalHooks?.run('n8n.stop');
            await di_1.Container.get(active_executions_1.ActiveExecutions).shutdown();
        }
        catch (error) {
            await this.exitWithCrash('Error shutting down worker', error);
        }
        await this.exitSuccessFully();
    }
    constructor() {
        super();
        this.needsCommunityPackages = true;
        this.needsExpressionEngine = true;
        this.needsTaskRunner = true;
        this.seedsInstanceIdentity = true;
        if (this.globalConfig.executions.mode !== 'queue') {
            this.globalConfig.executions.mode = 'queue';
        }
        this.logger = this.logger.scoped('scaling');
    }
    async init() {
        const { QUEUE_WORKER_TIMEOUT } = process.env;
        if (QUEUE_WORKER_TIMEOUT) {
            const parsed = Number(QUEUE_WORKER_TIMEOUT);
            const isValid = Number.isInteger(parsed) && parsed > 0;
            if (!isValid) {
                this.logger.warn(`Invalid QUEUE_WORKER_TIMEOUT value "${QUEUE_WORKER_TIMEOUT}". Using the configured queue timeout.`);
            }
            const timeout = isValid ? parsed : this.globalConfig.queue.bull.gracefulShutdownTimeout;
            this.gracefulShutdownTimeoutInS = timeout;
            this.globalConfig.generic.gracefulShutdownTimeout = timeout;
            this.logger.warn('QUEUE_WORKER_TIMEOUT has been deprecated. Rename it to N8N_GRACEFUL_SHUTDOWN_TIMEOUT.');
        }
        await this.initCrashJournal();
        this.logger.debug('Starting n8n worker...');
        this.logger.debug(`Host ID: ${this.instanceSettings.hostId}`);
        await this.setConcurrency();
        await super.init();
        di_1.Container.get(deprecation_service_1.DeprecationService).warn();
        await di_1.Container.get(backend_services_1.JwtService).initialize(di_1.Container.get(db_1.DeploymentKeyRepository));
        await di_1.Container.get(n8n_core_1.BinaryDataConfig).initialize(di_1.Container.get(db_1.DeploymentKeyRepository));
        await this.initLicense();
        this.logger.debug('License init complete');
        if ((0, queue_name_1.resolveWorkerPoolName)(this.globalConfig.queue.workerPool) !== '' &&
            !di_1.Container.get(backend_common_1.LicenseState).isWorkerPoolsLicensed()) {
            this.logger.error('A worker pool is configured (`N8N_WORKER_POOL_NAME`), but worker pools are not licensed. Either remove the worker pool configuration, or upgrade to a license that supports this feature.');
            process.exit(1);
        }
        await this.initCommunityPackages();
        await di_1.Container.get(credentials_overwrites_1.CredentialsOverwrites).init();
        this.logger.debug('Credentials overwrites init complete');
        await this.initBinaryDataService();
        this.logger.debug('Binary data service init complete');
        await this.initDataDeduplicationService();
        this.logger.debug('Data deduplication service init complete');
        await this.initExternalHooks();
        this.logger.debug('External hooks init complete');
        await this.initEventBus();
        this.logger.debug('Event bus init complete');
        await this.initScalingService();
        await this.initOrchestration();
        this.logger.debug('Orchestration init complete');
        await di_1.Container.get(message_event_bus_1.MessageEventBus).send(new event_message_generic_1.EventMessageGeneric({
            eventName: 'n8n.worker.started',
            payload: {
                workerId: this.instanceSettings.hostId,
            },
        }));
        await this.moduleRegistry.initModules(this.instanceSettings.instanceType);
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        await this.executionContextHookRegistry.init();
        await di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).postProcessLoaders();
    }
    async initEventBus() {
        await di_1.Container.get(message_event_bus_1.MessageEventBus).initialize({
            workerId: this.instanceSettings.hostId,
        });
        di_1.Container.get(log_streaming_event_relay_1.LogStreamingEventRelay).init();
    }
    async initOrchestration() {
        di_1.Container.get(publisher_service_1.Publisher);
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        const subscriber = di_1.Container.get(subscriber_service_1.Subscriber);
        await subscriber.subscribe(subscriber.getCommandChannel());
        di_1.Container.get(worker_status_service_ee_1.WorkerStatusService);
        di_1.Container.get(execution_stop_service_1.ExecutionStopService);
    }
    async setConcurrency() {
        const { flags } = this;
        const envConcurrency = this.globalConfig.executions.concurrency.productionLimit;
        this.concurrency = envConcurrency !== -1 ? envConcurrency : flags.concurrency;
        if (this.concurrency < 5) {
            this.logger.warn('Concurrency is set to less than 5. THIS CAN LEAD TO AN UNSTABLE ENVIRONMENT. Please consider increasing it to at least 5 to make best use of the worker.');
        }
    }
    async initScalingService() {
        const { ScalingService } = await import('../scaling/scaling.service.js');
        this.scalingService = di_1.Container.get(ScalingService);
        await this.scalingService.setupQueue();
    }
    async run() {
        const endpointsConfig = {
            health: this.globalConfig.queue.health.active,
            overwrites: this.globalConfig.credentials.overwrite.endpoint !== '',
            metrics: this.globalConfig.endpoints.metrics.enable,
        };
        let workerServer;
        if (constants_1.inE2ETests || Object.values(endpointsConfig).some((e) => e)) {
            const { WorkerServer } = await import('../scaling/worker-server.js');
            workerServer = di_1.Container.get(WorkerServer);
            await workerServer.init(endpointsConfig);
        }
        await this.initSystemTasks();
        this.scalingService.setupWorker(this.concurrency);
        workerServer?.markAsReady();
        const poolName = (0, queue_name_1.resolveWorkerPoolName)(this.globalConfig.queue.workerPool);
        const queueName = (0, queue_name_1.resolveQueueName)('worker', poolName);
        this.logger.info('\nn8n worker is now ready');
        this.logger.info(` * Version: ${constants_1.N8N_VERSION}`);
        this.logger.info(` * Concurrency: ${this.concurrency}`);
        this.logger.info(` * Pool: ${poolName === '' ? '(default)' : poolName}`);
        this.logger.info(` * Queue: ${queueName}`);
        this.logger.info('');
        if (!backend_common_1.inTest && process.stdout.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (key) => {
                if (key.charCodeAt(0) === 3)
                    process.kill(process.pid, 'SIGINT');
            });
        }
        di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).releaseTypes();
        if (!backend_common_1.inTest)
            await new Promise(() => { });
    }
    async catch(error) {
        await this.exitWithCrash('Worker exiting due to an error.', error);
    }
};
exports.Worker = Worker;
exports.Worker = Worker = __decorate([
    (0, decorators_1.Command)({
        name: 'worker',
        description: 'Starts a n8n worker',
        examples: ['--concurrency=5'],
        flagsSchema,
    }),
    __metadata("design:paramtypes", [])
], Worker);
//# sourceMappingURL=worker.js.map