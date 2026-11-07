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
var AbstractServer_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractServer = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const promises_1 = require("fs/promises");
const isbot_1 = __importDefault(require("isbot"));
const n8n_core_1 = require("n8n-core");
const config_2 = __importDefault(require("./config"));
const constants_1 = require("./constants");
const errors_1 = require("@n8n/errors");
const external_hooks_1 = require("./external-hooks");
const middlewares_1 = require("./middlewares");
const response_helper_1 = require("./response-helper");
const database_independent_routes_service_1 = require("./services/database-independent-routes.service");
const handlebars_util_1 = require("./utils/handlebars.util");
const live_webhooks_1 = require("./webhooks/live-webhooks");
const slack_interaction_webhooks_1 = require("./webhooks/slack-interaction-webhooks");
const telegram_interaction_webhooks_1 = require("./webhooks/telegram-interaction-webhooks");
const test_webhooks_1 = require("./webhooks/test-webhooks");
const waiting_forms_1 = require("./webhooks/waiting-forms");
const waiting_webhooks_1 = require("./webhooks/waiting-webhooks");
const webhook_request_handler_1 = require("./webhooks/webhook-request-handler");
const health_endpoint_util_1 = require("./utils/health-endpoint.util");
let AbstractServer = AbstractServer_1 = class AbstractServer {
    constructor() {
        this.globalConfig = di_1.Container.get(config_1.GlobalConfig);
        this.dbConnection = di_1.Container.get(db_1.DbConnection);
        this.databaseIndependentRoutes = di_1.Container.get(database_independent_routes_service_1.DatabaseIndependentRoutes);
        this.webhooksEnabled = true;
        this.testWebhooksEnabled = false;
        this.fullyReady = false;
        this.app = (0, express_1.default)();
        this.app.disable('x-powered-by');
        this.app.set('query parser', 'extended');
        this.app.engine('handlebars', (0, handlebars_util_1.createHandlebarsEngine)());
        this.app.set('view engine', 'handlebars');
        this.app.set('views', constants_1.TEMPLATES_DIR);
        const proxyHops = this.globalConfig.proxy_hops;
        if (proxyHops > 0)
            this.app.set('trust proxy', proxyHops);
        this.sslKey = this.globalConfig.ssl_key;
        this.sslCert = this.globalConfig.ssl_cert;
        const { endpoints } = this.globalConfig;
        this.restEndpoint = endpoints.rest;
        this.endpointForm = endpoints.form;
        this.endpointFormTest = endpoints.formTest;
        this.endpointFormWaiting = endpoints.formWaiting;
        this.endpointWebhook = endpoints.webhook;
        this.endpointWebhookTest = endpoints.webhookTest;
        this.endpointWebhookWaiting = endpoints.webhookWaiting;
        this.endpointMcp = endpoints.mcp;
        this.endpointMcpTest = endpoints.mcpTest;
        this.endpointHealth = (0, health_endpoint_util_1.resolveBackendHealthEndpointPath)(this.globalConfig);
        this.logger = di_1.Container.get(backend_common_1.Logger);
    }
    async configure() {
    }
    async setupErrorHandlers() {
        const { app } = this;
        const { setupExpressErrorHandler } = await import('@sentry/node');
        setupExpressErrorHandler(app);
    }
    setupCommonMiddlewares() {
        this.app.use((0, compression_1.default)());
        this.app.use(middlewares_1.rawBodyReader);
    }
    setupDevMiddlewares() {
        this.app.use(middlewares_1.corsMiddleware);
    }
    setupPushServer() { }
    markAsReady() {
        this.fullyReady = true;
    }
    setupHealthCheck() {
        const healthPath = this.endpointHealth;
        const readinessPath = `${healthPath}/readiness`;
        const healthMiddlewares = backend_common_1.inDevelopment ? [middlewares_1.corsMiddleware] : [];
        this.app.get(healthPath, ...healthMiddlewares, (_req, res) => {
            res.send({ status: 'ok' });
        });
        const { connectionState } = this.dbConnection;
        this.app.get(readinessPath, ...healthMiddlewares, (_req, res) => {
            const { connected, migrated } = connectionState;
            if (connected && migrated && this.fullyReady) {
                res.status(200).send({ status: 'ok' });
            }
            else {
                res.status(503).send({ status: 'error' });
            }
        });
        this.app.use((req, res, next) => {
            if (this.isServedWithoutDatabase(req)) {
                next();
                return;
            }
            if (connectionState.connected) {
                if (connectionState.migrated)
                    next();
                else
                    res.send('n8n is starting up. Please wait');
            }
            else
                (0, response_helper_1.sendErrorResponse)(res, new errors_1.ServiceUnavailableError('Database is not ready!'));
        });
    }
    isServedWithoutDatabase(req) {
        return (this.dbConnection.connectionState.migrated &&
            (req.method === 'GET' || req.method === 'HEAD') &&
            this.databaseIndependentRoutes.has(req.path));
    }
    async init() {
        const { app, sslKey, sslCert } = this;
        const { protocol } = this.globalConfig;
        if (protocol === 'https' && sslKey && sslCert) {
            const https = await import('https');
            this.server = https.createServer({
                key: await (0, promises_1.readFile)(this.sslKey, 'utf8'),
                cert: await (0, promises_1.readFile)(this.sslCert, 'utf8'),
            }, app);
        }
        else {
            const http = await import('http');
            this.server = http.createServer(app);
        }
        const { port, listen_address: address } = di_1.Container.get(config_1.GlobalConfig);
        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                this.logger.error(`n8n's port ${port} is already in use. Do you have another instance of n8n running already?`);
            }
            else if (error.code === 'EACCES') {
                this.logger.error(`n8n does not have permission to use port ${port}. Please run n8n with a different port.`);
            }
            else if (error.code === 'EAFNOSUPPORT') {
                this.logger.error(`n8n's address '${address}' is not available. Please run n8n with a different address, provide correct address in the environment variables N8N_LISTEN_ADDRESS and/or N8N_WORKER_SERVER_ADDRESS.`);
            }
            else {
                this.logger.error('n8n webserver failed, exiting', {
                    message: error.message,
                    code: error.code,
                });
            }
            process.exit(1);
        });
        await new Promise((resolve) => this.server.listen(port, address, () => resolve()));
        this.externalHooks = di_1.Container.get(external_hooks_1.ExternalHooks);
        this.setupHealthCheck();
        this.logger.info(`n8n ready on ${address}, port ${port}`);
    }
    async start() {
        if (!backend_common_1.inTest) {
            await this.setupErrorHandlers();
            this.setupPushServer();
        }
        this.setupCommonMiddlewares();
        if (this.webhooksEnabled) {
            const liveWebhooks = di_1.Container.get(live_webhooks_1.LiveWebhooks);
            this.app.all(`/${this.endpointForm}/*path`, (0, webhook_request_handler_1.createWebhookHandlerFor)(liveWebhooks, 'form'));
            this.app.all(`/${this.endpointWebhook}/*path`, (0, webhook_request_handler_1.createWebhookHandlerFor)(liveWebhooks, 'webhook'));
            this.app.all(`/${this.endpointFormWaiting}/:path{/:suffix}`, (0, webhook_request_handler_1.createWebhookHandlerFor)(di_1.Container.get(waiting_forms_1.WaitingForms), undefined, 'form'));
            this.app.all(`/${this.endpointWebhookWaiting}/:path{/:suffix}`, (0, webhook_request_handler_1.createWebhookHandlerFor)(di_1.Container.get(waiting_webhooks_1.WaitingWebhooks)));
            this.app.all(`/${this.endpointWebhookWaiting}${n8n_core_1.SLACK_HITL_WEBHOOK_SUFFIX}`, (0, webhook_request_handler_1.createWebhookHandlerFor)(di_1.Container.get(slack_interaction_webhooks_1.SlackInteractionWebhooks)));
            this.app.all(`/${this.endpointWebhookWaiting}${n8n_core_1.TELEGRAM_HITL_WEBHOOK_SUFFIX}`, (0, webhook_request_handler_1.createWebhookHandlerFor)(di_1.Container.get(telegram_interaction_webhooks_1.TelegramInteractionWebhooks)));
            this.app.all(`/${this.endpointMcp}/*path`, (0, webhook_request_handler_1.createWebhookHandlerFor)(liveWebhooks, 'mcp'));
        }
        if (this.testWebhooksEnabled) {
            const testWebhooks = di_1.Container.get(test_webhooks_1.TestWebhooks);
            this.app.all(`/${this.endpointFormTest}/*path`, (0, webhook_request_handler_1.createWebhookHandlerFor)(testWebhooks, 'form'));
            this.app.all(`/${this.endpointWebhookTest}/*path`, (0, webhook_request_handler_1.createWebhookHandlerFor)(testWebhooks, 'webhook'));
            this.app.all(`/${this.endpointMcpTest}/*path`, (0, webhook_request_handler_1.createWebhookHandlerFor)(testWebhooks, 'mcp'));
        }
        const checkIfBot = isbot_1.default.spawn(['bot']);
        this.app.use((req, res, next) => {
            const userAgent = req.headers['user-agent'];
            if (userAgent && checkIfBot(userAgent)) {
                const allowed = AbstractServer_1.botAllowedPaths.some((pattern) => new RegExp(`^${pattern}$`).test(req.path));
                if (allowed) {
                    next();
                    return;
                }
                this.logger.info(`Blocked ${req.method} ${req.url} for "${userAgent}"`);
                res.status(204).end();
            }
            else
                next();
        });
        if (backend_common_1.inDevelopment) {
            this.setupDevMiddlewares();
        }
        this.app.use(middlewares_1.bodyParser);
        await this.configure();
        if (!backend_common_1.inTest) {
            this.logger.info(`Version: ${constants_1.N8N_VERSION}`);
            const { defaultLocale } = this.globalConfig;
            if (defaultLocale !== 'en') {
                this.logger.info(`Locale: ${defaultLocale}`);
            }
            await this.externalHooks.run('n8n.ready', [this, config_2.default]);
        }
    }
    onShutdown() {
        if (!this.server) {
            return;
        }
        const { protocol } = this.globalConfig;
        this.logger.debug(`Shutting down ${protocol} server`);
        this.server.close((error) => {
            if (error) {
                this.logger.error(`Error while shutting down ${protocol} server`, { error });
            }
            this.logger.debug(`${protocol} server shut down`);
        });
    }
};
exports.AbstractServer = AbstractServer;
AbstractServer.botAllowedPaths = [];
__decorate([
    (0, decorators_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AbstractServer.prototype, "onShutdown", null);
exports.AbstractServer = AbstractServer = AbstractServer_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [])
], AbstractServer);
//# sourceMappingURL=abstract-server.js.map