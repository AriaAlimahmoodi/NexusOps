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
exports.EngineV2Runtime = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const engine_1 = require("@n8n/engine");
const node_engine_compatibility_1 = require("@n8n/node-engine-compatibility");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = __importDefault(require("node:assert"));
const credential_types_1 = require("../../credential-types");
const credentials_helper_1 = require("../../credentials-helper");
const node_types_1 = require("../../node-types");
const engine_additional_data_1 = require("./engine-additional-data");
const engine_control_plane_client_1 = require("./engine-control-plane-client");
const engine_credentials_client_1 = require("./engine-credentials-client");
const remote_credentials_helper_1 = require("./remote-credentials-helper");
let EngineV2Runtime = class EngineV2Runtime {
    constructor(engineConfig, nodeTypes, logger, controlPlaneClient, credentialsClient, credentialsHelper, credentialTypes, additionalDataBuilder, binaryDataService) {
        this.engineConfig = engineConfig;
        this.nodeTypes = nodeTypes;
        this.logger = logger;
        this.controlPlaneClient = controlPlaneClient;
        this.credentialsClient = credentialsClient;
        this.credentialsHelper = credentialsHelper;
        this.credentialTypes = credentialTypes;
        this.additionalDataBuilder = additionalDataBuilder;
        this.binaryDataService = binaryDataService;
        this.logger = this.logger.scoped('engine-v2');
    }
    async init(responseSender = engine_1.noopExecutionResponseSender) {
        try {
            await this.initDb();
            this.initEngine(responseSender);
            await this.initServer();
        }
        catch (error) {
            await this.shutdown().catch((teardownError) => {
                this.logger.error('Failed to roll back after Engine v2 could not start', {
                    teardownError,
                });
            });
            throw error;
        }
    }
    async initDb() {
        const { databaseUrl } = this.engineConfig;
        if (!databaseUrl) {
            throw new n8n_workflow_1.UserError('The engine-v2 module needs a data plane database. Set N8N_ENGINE_DATABASE_URL.');
        }
        this.dataSource = (0, engine_1.createDataSource)(databaseUrl);
        await this.dataSource.initialize();
        await this.dataSource.runMigrations();
    }
    initEngine(responseSender) {
        (0, node_assert_1.default)(this.dataSource, 'Engine v2 cannot start without a data source');
        const stopping = new AbortController();
        this.stopping = stopping;
        const engine = (0, engine_1.createEngineRuntime)({
            dataSource: this.dataSource,
            admittance: new engine_1.AllowAllAdmittance(),
            identityVerifier: new engine_1.SharedSecretIdentityVerifier(this.engineConfig.authSecret),
            logger: this.logger,
            responseSender,
            externalDependencies: ({ executionStore, stepStore }) => ({
                lifecycleEventCallback: async (events, signal) => await this.controlPlaneClient.sendLifecycleEvents(events, signal),
                deleteExecutionFiles: async ({ workflowId, executionId }) => await this.binaryDataService.deleteMany([
                    n8n_core_1.FileLocation.ofExecution(workflowId, executionId),
                ]),
                v1StepExecutor: new node_engine_compatibility_1.V1StepExecutor({
                    nodeTypes: this.nodeTypes,
                    additionalDataFactory: async (context) => this.buildAdditionalData(context, stopping),
                    loadStepData: (0, node_engine_compatibility_1.createEngineStepDataLoader)(executionStore, stepStore),
                }),
            }),
        });
        engine.start();
        this.engine = engine;
    }
    buildAdditionalData(context, stopping) {
        const credentialsHelper = new remote_credentials_helper_1.RemoteCredentialsHelper(this.credentialsClient, this.credentialsHelper, this.credentialTypes, context, stopping.signal);
        return this.additionalDataBuilder.build(context, credentialsHelper);
    }
    async initServer() {
        const { host, port } = this.engineConfig;
        this.server = await new Promise((resolve, reject) => {
            (0, node_assert_1.default)(this.engine, 'Engine v2 cannot start without an engine runtime');
            const listener = this.engine.app.listen(port, host);
            listener.once('listening', () => resolve(listener));
            listener.once('error', reject);
        });
        const shownHost = host.includes(':') ? `[${host}]` : host;
        this.logger.info(`Engine v2 listening on http://${shownHost}:${port}`);
    }
    async shutdown() {
        const errors = [];
        const shutdownTasks = [
            async () => await this.closeServer(),
            async () => await this.stopEngine(),
            async () => await this.destroyDataSource(),
        ];
        for (const release of shutdownTasks) {
            await release().catch((error) => {
                errors.push(error);
            });
        }
        if (errors.length > 0) {
            throw new AggregateError(errors, 'Engine v2 could not release every resource');
        }
    }
    async closeServer() {
        if (!this.server)
            return;
        await new Promise((resolve, reject) => {
            this.server.close((error) => (error ? reject(error) : resolve()));
        });
        this.server = undefined;
    }
    async stopEngine() {
        if (!this.engine)
            return;
        await this.engine.stop();
        this.engine = undefined;
        this.stopping?.abort();
        this.stopping = undefined;
    }
    async destroyDataSource() {
        if (!this.dataSource)
            return;
        if (this.dataSource.isInitialized)
            await this.dataSource.destroy();
        this.dataSource = undefined;
    }
};
exports.EngineV2Runtime = EngineV2Runtime;
exports.EngineV2Runtime = EngineV2Runtime = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.EngineConfig, node_types_1.NodeTypes, backend_common_1.Logger, engine_control_plane_client_1.EngineControlPlaneClient, engine_credentials_client_1.EngineCredentialsClient, credentials_helper_1.CredentialsHelper, credential_types_1.CredentialTypes, engine_additional_data_1.EngineAdditionalDataBuilder, n8n_core_1.BinaryDataService])
], EngineV2Runtime);
//# sourceMappingURL=engine-v2.runtime.js.map