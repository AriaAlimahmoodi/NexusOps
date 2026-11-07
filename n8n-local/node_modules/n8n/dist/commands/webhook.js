"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Webhook = void 0;
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const active_executions_1 = require("../active-executions");
const deprecation_service_1 = require("../deprecation/deprecation.service");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const log_streaming_event_relay_1 = require("../events/relays/log-streaming.event-relay");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const publisher_service_1 = require("../scaling/pubsub/publisher.service");
const pubsub_registry_1 = require("../scaling/pubsub/pubsub.registry");
const subscriber_service_1 = require("../scaling/pubsub/subscriber.service");
const backend_services_1 = require("@n8n/backend-services");
const webhook_server_1 = require("../webhooks/webhook-server");
const base_command_1 = require("./base-command");
let Webhook = class Webhook extends base_command_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.server = di_1.Container.get(webhook_server_1.WebhookServer);
        this.needsCommunityPackages = true;
        this.needsExpressionEngine = true;
        this.seedsInstanceIdentity = true;
    }
    async stopProcess() {
        this.logger.info('\nStopping n8n...');
        try {
            await this.externalHooks?.run('n8n.stop');
            await di_1.Container.get(active_executions_1.ActiveExecutions).shutdown();
        }
        catch (error) {
            await this.exitWithCrash('There was an error shutting down n8n.', error);
        }
        await this.exitSuccessFully();
    }
    async init() {
        if (this.globalConfig.executions.mode !== 'queue') {
            this.error('Webhook processes can only run with execution mode as queue.');
        }
        await this.initCrashJournal();
        this.logger.debug('Crash journal initialized');
        this.logger.info('Starting n8n webhook process...');
        this.logger.debug(`Host ID: ${this.instanceSettings.hostId}`);
        await super.init();
        di_1.Container.get(deprecation_service_1.DeprecationService).warn();
        await di_1.Container.get(backend_services_1.JwtService).initialize(di_1.Container.get(db_1.DeploymentKeyRepository));
        await di_1.Container.get(n8n_core_1.BinaryDataConfig).initialize(di_1.Container.get(db_1.DeploymentKeyRepository));
        await this.initLicense();
        this.logger.debug('License init complete');
        await this.initCommunityPackages();
        await this.initOrchestration();
        this.logger.debug('Orchestration init complete');
        await this.initBinaryDataService();
        this.logger.debug('Binary data service init complete');
        await this.initDataDeduplicationService();
        this.logger.debug('Data deduplication service init complete');
        await this.initExternalHooks();
        this.logger.debug('External hooks init complete');
        await di_1.Container.get(message_event_bus_1.MessageEventBus).initialize({
            webhookProcessorId: this.instanceSettings.hostId,
        });
        di_1.Container.get(log_streaming_event_relay_1.LogStreamingEventRelay).init();
        await this.moduleRegistry.initModules(this.instanceSettings.instanceType);
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        await this.executionContextHookRegistry.init();
        await di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).postProcessLoaders();
    }
    async run() {
        const { ScalingService } = await import('../scaling/scaling.service.js');
        await di_1.Container.get(ScalingService).setupQueue();
        await this.server.start();
        await this.initSystemTasks();
        this.server.markAsReady();
        this.logger.info('Webhook listener waiting for requests.');
        di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).releaseTypes();
        await new Promise(() => { });
    }
    async catch(error) {
        await this.exitWithCrash('Exiting due to an error.', error);
    }
    async initOrchestration() {
        di_1.Container.get(publisher_service_1.Publisher);
        const subscriber = di_1.Container.get(subscriber_service_1.Subscriber);
        di_1.Container.get(pubsub_registry_1.PubSubRegistry).init();
        await subscriber.subscribe(subscriber.getCommandChannel());
    }
};
exports.Webhook = Webhook;
exports.Webhook = Webhook = __decorate([
    (0, decorators_1.Command)({
        name: 'webhook',
        description: 'Starts n8n webhook process. Intercepts only production URLs.',
    })
], Webhook);
//# sourceMappingURL=webhook.js.map