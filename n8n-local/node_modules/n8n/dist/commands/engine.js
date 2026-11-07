"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Engine = void 0;
const blob_storage_1 = require("@n8n/blob-storage");
const config_1 = require("@n8n/config");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const base_command_1 = require("./base-command");
let Engine = class Engine extends base_command_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.needsDb = false;
        this.needsTaskRunner = false;
        this.needsExpressionEngine = true;
    }
    async init() {
        this.errorReporter = di_1.Container.get(n8n_core_1.ErrorReporter);
        assertControlPlaneIsolated(process.env);
        assertRemoteControlPlane(di_1.Container.get(config_1.EngineConfig));
        this.logger.info('Starting engine v2 data plane...');
        this.logger.debug(`Host ID: ${this.instanceSettings.hostId}`);
        await super.init();
        await this.initBinaryDataStore();
        const { createRedisExecutionResponseSender } = await import('../modules/engine-v2/response-channel/redis-execution-response-channel.js');
        this.responseSender = await createRedisExecutionResponseSender(this.logger.scoped('engine-v2'));
        const { EngineV2Runtime } = await import('../modules/engine-v2/engine-v2.runtime.js');
        this.runtime = di_1.Container.get(EngineV2Runtime);
        await this.runtime.init(this.responseSender);
        await di_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).postProcessLoaders();
    }
    async initBinaryDataStore() {
        const { mode } = di_1.Container.get(n8n_core_1.BinaryDataConfig);
        if (mode === 'database') {
            throw new n8n_workflow_1.UserError('The engine process has no control plane database, so it cannot store binary data in `database` mode. Set N8N_DEFAULT_BINARY_DATA_MODE to filesystem, s3 or azure.');
        }
        if (mode === 's3' && di_1.Container.get(blob_storage_1.ObjectStoreConfig).bucket.name === '') {
            throw new n8n_workflow_1.UserError('S3 binary data storage requires `N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME` to be set.');
        }
        if (mode === 'azure' && di_1.Container.get(blob_storage_1.AzureBlobConfig).containerName === '') {
            throw new n8n_workflow_1.UserError('Azure Blob binary data storage requires `N8N_EXTERNAL_STORAGE_AZURE_CONTAINER_NAME` to be set.');
        }
        await this.initBinaryDataBlobManagers({ s3: mode === 's3', azure: mode === 'azure' });
        await di_1.Container.get(n8n_core_1.BinaryDataService).init();
    }
    async run() {
        this.logger.info('Engine v2 data plane waiting for executions.');
        await new Promise(() => { });
    }
    async catch(error) {
        await this.exitWithCrash('Exiting due to an error.', error);
    }
    async stopProcess() {
        this.logger.info('Stopping engine v2 data plane...');
        try {
            try {
                await this.runtime?.shutdown();
            }
            finally {
                await this.responseSender?.stop();
            }
            await n8n_workflow_1.Expression.disposeExpressionEngine();
        }
        catch (error) {
            await this.exitWithCrash('There was an error shutting down the engine.', error);
        }
        process.exit();
    }
};
exports.Engine = Engine;
exports.Engine = Engine = __decorate([
    (0, decorators_1.Command)({
        name: 'engine',
        description: 'Starts the engine v2 data plane. Needs a control plane (`n8n start` with N8N_ENGINE_MODE=remote) to report to and to resolve credentials from.',
    })
], Engine);
function assertControlPlaneIsolated(env) {
    const leaked = Object.keys(env).filter((key) => key.startsWith('DB_') || key === 'N8N_ENCRYPTION_KEY' || key === 'N8N_ENCRYPTION_KEY_FILE');
    if (leaked.length > 0) {
        throw new n8n_workflow_1.UserError(`The engine process must not have control plane database access. Remove ${leaked.join(', ')} from its environment.`);
    }
}
function assertRemoteControlPlane(config) {
    if (!config.authSecret) {
        throw new n8n_workflow_1.UserError('The engine process needs N8N_ENGINE_AUTH_SECRET. The control plane runs elsewhere, so nothing here can generate the shared secret.');
    }
    if (!config.controlPlaneBaseUrl) {
        throw new n8n_workflow_1.UserError('The engine process needs N8N_ENGINE_CONTROL_PLANE_BASE_URL. The default points at this process, which does not run the control plane.');
    }
}
//# sourceMappingURL=engine.js.map