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
exports.EngineControlPlaneServer = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const middlewares_1 = require("../../middlewares");
const response_helper_1 = require("../../response-helper");
const engine_control_plane_auth_middleware_1 = require("./engine-control-plane-auth.middleware");
const engine_credentials_controller_1 = require("./engine-credentials.controller");
const engine_lifecycle_event_controller_1 = require("./engine-lifecycle-event.controller");
const engine_v2_constants_1 = require("./engine-v2.constants");
let EngineControlPlaneServer = class EngineControlPlaneServer {
    get port() {
        return this.server?.address()?.port;
    }
    constructor(engineConfig, lifecycleEventController, credentialsController, logger) {
        this.engineConfig = engineConfig;
        this.lifecycleEventController = lifecycleEventController;
        this.credentialsController = credentialsController;
        this.logger = logger;
        this.logger = this.logger.scoped('engine-v2');
    }
    async start() {
        const app = (0, express_1.default)();
        app.disable('x-powered-by');
        this.configureRoutes(app);
        const { controlPlaneHost: host, controlPlanePort: port } = this.engineConfig;
        this.server = (0, node_http_1.createServer)(app);
        this.server.on('error', (error) => {
            if (error.code !== 'EADDRINUSE') {
                this.logger.error('Engine v2 control plane server error', { error });
                return;
            }
            this.logger.error(`Engine v2 control plane port ${port} is already in use`);
            if (!backend_common_1.inTest)
                process.exit(1);
        });
        await new Promise((resolve, reject) => {
            const onBindError = (error) => reject(error);
            this.server.once('error', onBindError);
            this.server.listen(port, host, () => {
                this.server.off('error', onBindError);
                resolve();
            });
        });
        const shownHost = host.includes(':') ? `[${host}]` : host;
        this.logger.info(`Engine v2 control plane listening on http://${shownHost}:${this.port}`);
    }
    async stop() {
        if (!this.server)
            return;
        await new Promise((resolve, reject) => {
            this.server.close((error) => (error ? reject(error) : resolve()));
        });
        this.server = undefined;
    }
    configureRoutes(app) {
        app.get('/healthz', (_req, res) => {
            res.status(200).json({ status: 'ok' });
        });
        app.post(engine_v2_constants_1.STATUS_CALLBACK_PATH, (0, engine_control_plane_auth_middleware_1.createEngineControlPlaneAuthMiddleware)(this.engineConfig, this.logger, 'lifecycle-events:write'), middlewares_1.rawBodyReader, middlewares_1.bodyParser, (0, response_helper_1.send)(async (req, res) => await this.lifecycleEventController.receiveLifecycleEvents(req, res)));
        app.post(engine_v2_constants_1.CREDENTIALS_RESOLVE_PATH, (0, engine_control_plane_auth_middleware_1.createEngineControlPlaneAuthMiddleware)(this.engineConfig, this.logger, 'credentials:read'), middlewares_1.rawBodyReader, middlewares_1.bodyParser, (0, response_helper_1.send)(async (req, res) => await this.credentialsController.resolveCredential(req, res)));
    }
};
exports.EngineControlPlaneServer = EngineControlPlaneServer;
exports.EngineControlPlaneServer = EngineControlPlaneServer = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.EngineConfig, engine_lifecycle_event_controller_1.EngineLifecycleEventController, engine_credentials_controller_1.EngineCredentialsController, backend_common_1.Logger])
], EngineControlPlaneServer);
//# sourceMappingURL=engine-control-plane-server.js.map