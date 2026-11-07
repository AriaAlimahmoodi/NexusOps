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
exports.InstanceAiBrowserSessionService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const node_crypto_1 = require("node:crypto");
const promises_1 = require("node:fs/promises");
const node_os_1 = require("node:os");
const node_path_1 = require("node:path");
const credentials_service_1 = require("../../../credentials/credentials.service");
const push_1 = require("../../../push");
const backend_services_1 = require("@n8n/backend-services");
const telemetry_1 = require("../../../telemetry");
const browser_local_mcp_server_1 = require("./browser-local-mcp-server");
const browser_use_ws_constants_1 = require("./browser-use-ws.constants");
const CONNECT_TOKEN_TTL_MS = 5 * 60 * 1000;
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
let InstanceAiBrowserSessionService = class InstanceAiBrowserSessionService {
    constructor(logger, urlService, push, userRepository, credentialsService, globalConfig, telemetry) {
        this.urlService = urlService;
        this.push = push;
        this.userRepository = userRepository;
        this.credentialsService = credentialsService;
        this.globalConfig = globalConfig;
        this.telemetry = telemetry;
        this.sessions = new Map();
        this.sessionsBySessionId = new Map();
        this.logger = logger.scoped('instance-ai');
    }
    async createLink(userId) {
        const session = this.sessions.get(userId) ?? (await this.createSession(userId));
        session.relayAuthToken = `bu_${(0, nanoid_1.nanoid)(32)}`;
        session.tokenCreatedAt = Date.now();
        const { buildExtensionConnectUrl } = await import('@n8n/mcp-browser');
        const relayEndpoint = this.buildExtensionEndpoint(session);
        const connectUrl = buildExtensionConnectUrl(relayEndpoint);
        const expiresAt = new Date(session.tokenCreatedAt + CONNECT_TOKEN_TTL_MS);
        return {
            connectUrl,
            expiresAt: expiresAt.toISOString(),
            ttlSeconds: Math.ceil(CONNECT_TOKEN_TTL_MS / 1000),
        };
    }
    getStatus(userId) {
        const session = this.sessions.get(userId);
        return {
            connected: session?.connected ?? false,
            connectedAt: session?.connectedAt?.toISOString() ?? null,
            toolCategories: this.getToolCategories(userId),
        };
    }
    async disconnect(userId) {
        const session = this.sessions.get(userId);
        if (!session)
            return;
        this.sessions.delete(userId);
        this.sessionsBySessionId.delete(session.sessionId);
        await this.teardownSession(session);
        this.pushState(userId);
    }
    findMcpServer(userId) {
        const session = this.sessions.get(userId);
        return session?.connected ? session.mcpServer : undefined;
    }
    isConnected(userId) {
        return this.sessions.get(userId)?.connected ?? false;
    }
    getExtensionTraceContext(userId) {
        const session = this.sessions.get(userId);
        if (!session?.connected)
            return { connectionState: 'disconnected' };
        return {
            connectionState: 'connected',
            ...(session.extensionVersion !== null ? { version: session.extensionVersion } : {}),
        };
    }
    handleExtensionUpgrade(req) {
        const session = this.sessionsBySessionId.get(req.params.sessionId);
        const token = typeof req.query.token === 'string' ? req.query.token : null;
        if (!session || !this.isExtensionTokenValid(session, token)) {
            req.ws.close(4003, 'Invalid auth token');
            return;
        }
        session.extensionVersion = (0, browser_use_ws_constants_1.parseExtensionVersion)(req.query[browser_use_ws_constants_1.EXTENSION_VERSION_QUERY_PARAM]);
        session.relay.attachExtension(req.ws);
    }
    handleCdpUpgrade(req) {
        const session = this.sessionsBySessionId.get(req.params.sessionId);
        const header = req.headers[browser_use_ws_constants_1.CDP_TOKEN_HEADER];
        const token = typeof header === 'string' ? header : null;
        if (!session ||
            !LOOPBACK_ADDRESSES.has(req.socket.remoteAddress ?? '') ||
            !this.tokensMatch(session.cdpToken, token)) {
            req.ws.close(4003, 'Invalid auth token');
            return;
        }
        session.relay.attachController(req.ws);
    }
    async shutdown() {
        const sessions = [...this.sessions.values()];
        this.sessions.clear();
        this.sessionsBySessionId.clear();
        for (const session of sessions) {
            await this.teardownSession(session);
        }
    }
    async createSession(userId) {
        const { CDPRelayServer, createBrowserTools } = await import('@n8n/mcp-browser');
        const sessionId = (0, nanoid_1.nanoid)();
        const cdpToken = `cdp_${(0, nanoid_1.nanoid)(32)}`;
        const relay = new CDPRelayServer({ noServer: true });
        relay.onExtensionConnect = () => this.handleExtensionConnected(userId);
        relay.onExtensionDisconnect = () => this.handleExtensionDisconnected(userId);
        const toolkit = createBrowserTools({ mode: 'remote' }, {
            relay,
            cdpEndpoint: this.buildCdpEndpoint(sessionId),
            cdpConnectHeaders: { [browser_use_ws_constants_1.CDP_TOKEN_HEADER]: cdpToken },
        });
        const workDir = (0, node_path_1.join)((0, node_os_1.tmpdir)(), 'n8n-instance-ai-browser', userId);
        await (0, promises_1.mkdir)(workDir, { recursive: true });
        const toolContext = {
            dir: workDir,
            secretsBuffer: createInMemorySecretsBuffer(),
            createCredential: async (payload) => await this.createCredential(userId, payload),
        };
        const session = {
            userId,
            sessionId,
            relay,
            relayAuthToken: `bu_${(0, nanoid_1.nanoid)(32)}`,
            cdpToken,
            tokenCreatedAt: Date.now(),
            hasConnectedOnce: false,
            connected: false,
            connectedAt: null,
            extensionVersion: null,
            connection: toolkit.connection,
            mcpServer: new browser_local_mcp_server_1.BrowserLocalMcpServer(toolkit, toolContext, this.logger),
        };
        this.sessions.set(userId, session);
        this.sessionsBySessionId.set(sessionId, session);
        return session;
    }
    async teardownSession(session) {
        try {
            await session.connection.shutdown();
        }
        catch (error) {
            this.logger.warn('Failed to shut down browser connection', {
                error: error instanceof Error ? error.message : String(error),
            });
        }
        session.relay.stop();
        session.connected = false;
        session.connectedAt = null;
    }
    handleExtensionConnected(userId) {
        const session = this.sessions.get(userId);
        if (!session) {
            return;
        }
        session.connected = true;
        session.connectedAt = new Date();
        session.hasConnectedOnce = true;
        void session.mcpServer.callTool({
            name: 'browser_connect',
            arguments: {},
        });
        this.telemetry.track('Instance AI Browser connected', {
            user_id: userId,
            browser_extension_version: session.extensionVersion,
        });
        this.logger.info('Browser Use extension connected', {
            userId,
            extensionVersion: session.extensionVersion,
        });
        this.pushState(userId);
    }
    handleExtensionDisconnected(userId) {
        const session = this.sessions.get(userId);
        if (!session) {
            return;
        }
        session.connected = false;
        session.connectedAt = null;
        this.logger.info('Browser Use extension disconnected', { userId });
        this.pushState(userId);
    }
    pushState(userId) {
        const session = this.sessions.get(userId);
        this.push.sendToUsers({
            type: 'instanceAiBrowserStateChanged',
            data: {
                connected: session?.connected ?? false,
                connectedAt: session?.connectedAt?.toISOString() ?? null,
                toolCategories: this.getToolCategories(userId),
            },
        }, [userId]);
    }
    getToolCategories(userId) {
        const session = this.sessions.get(userId);
        return session?.connected ? [{ name: 'browser', enabled: true }] : [];
    }
    isExtensionTokenValid(session, token) {
        if (!this.tokensMatch(session.relayAuthToken, token)) {
            return false;
        }
        if (!session.hasConnectedOnce) {
            return Date.now() - session.tokenCreatedAt <= CONNECT_TOKEN_TTL_MS;
        }
        return true;
    }
    tokensMatch(expected, actual) {
        if (!actual) {
            return false;
        }
        const expectedBuffer = Buffer.from(expected);
        const actualBuffer = Buffer.from(actual);
        return (expectedBuffer.length === actualBuffer.length && (0, node_crypto_1.timingSafeEqual)(expectedBuffer, actualBuffer));
    }
    async createCredential(userId, payload) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ['role'],
        });
        if (!user) {
            throw new n8n_workflow_1.UnexpectedError('User for browser session not found');
        }
        const credential = await this.credentialsService.createUnmanagedCredential(payload, user);
        return { credentialId: credential.id };
    }
    buildExtensionEndpoint(session) {
        const token = encodeURIComponent(session.relayAuthToken);
        return `${this.getPublicWsBaseUrl()}${browser_use_ws_constants_1.BROWSER_USE_WS_NAMESPACE}/extension/${session.sessionId}?token=${token}`;
    }
    buildCdpEndpoint(sessionId) {
        return `ws://127.0.0.1:${this.globalConfig.port}${browser_use_ws_constants_1.BROWSER_USE_WS_NAMESPACE}/cdp/${sessionId}`;
    }
    getPublicWsBaseUrl() {
        const base = new URL(this.urlService.getInstanceBaseUrl());
        const scheme = base.protocol === 'https:' ? 'wss' : 'ws';
        return `${scheme}://${base.host}`;
    }
};
exports.InstanceAiBrowserSessionService = InstanceAiBrowserSessionService;
exports.InstanceAiBrowserSessionService = InstanceAiBrowserSessionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, backend_services_1.UrlService, push_1.Push, db_1.UserRepository, credentials_service_1.CredentialsService, config_1.GlobalConfig, telemetry_1.Telemetry])
], InstanceAiBrowserSessionService);
function createInMemorySecretsBuffer() {
    const store = new Map();
    return {
        capture(credentialsKey, field, value) {
            const fields = store.get(credentialsKey) ?? new Map();
            fields.set(field, value);
            store.set(credentialsKey, fields);
        },
        getFields(credentialsKey) {
            return store.get(credentialsKey);
        },
        clear(credentialsKey) {
            store.delete(credentialsKey);
        },
    };
}
//# sourceMappingURL=instance-ai-browser-session.service.js.map