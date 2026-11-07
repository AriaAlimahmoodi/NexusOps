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
exports.TrustedSourceDiscoveryService = exports.RUN_DEADLINE_MS = exports.CONCURRENCY = exports.DUE_BATCH = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const n8n_workflow_1 = require("n8n-workflow");
const trusted_source_store_1 = require("./trusted-source.store");
exports.DUE_BATCH = 200;
exports.CONCURRENCY = 5;
exports.RUN_DEADLINE_MS = 40 * constants_1.Time.seconds.toMilliseconds;
let TrustedSourceDiscoveryService = class TrustedSourceDiscoveryService {
    constructor(logger, store, client, localServer) {
        this.logger = logger;
        this.store = store;
        this.client = client;
        this.localServer = localServer;
    }
    async refresh(sourceId) {
        const source = await this.store.getById(sourceId);
        if (source)
            await this.refreshSource(source);
    }
    async refreshDue(signal) {
        const deadline = Date.now() + exports.RUN_DEADLINE_MS;
        const queue = await this.store.listDue(exports.DUE_BATCH);
        const worker = async () => {
            while (!signal.aborted && Date.now() < deadline) {
                const source = queue.shift();
                if (source === undefined)
                    return;
                await this.refreshSource(source);
            }
        };
        await Promise.all(Array.from({ length: Math.min(exports.CONCURRENCY, queue.length) }, worker));
    }
    async refreshSource(source) {
        try {
            const token = await this.store.claimDiscovery(source);
            if (token === null)
                return;
            await this.store.recordDiscovery(source, token, await this.discover(source));
        }
        catch (error) {
            this.logger.error('Could not write the discovery result of a trusted source', {
                id: source.id,
                error,
            });
        }
    }
    async discover(source) {
        try {
            const documents = await this.collect(source);
            const metadata = inbound_auth_1.TrustedSourceMetadataSchema.parse({ version: 1, documents });
            return { metadata, status: 'healthy', lastError: null };
        }
        catch (error) {
            const lastError = (0, ensure_error_1.ensureError)(error).message;
            this.logger.warn('Trusted source discovery failed', { id: source.id, reason: lastError });
            return { status: 'error', lastError };
        }
    }
    async collect(source) {
        const { issuer, config } = source;
        const { authentication } = config;
        const fetchedAt = new Date().toISOString();
        if (authentication.keys.kind === 'local-keystore') {
            const document = await this.localServer.getMetadata();
            if (document.issuer !== issuer) {
                throw new n8n_workflow_1.OperationalError(`Local server metadata names issuer "${document.issuer}", expected "${issuer}"`);
            }
            if (!document.jwks_uri)
                throw new n8n_workflow_1.OperationalError(`Issuer "${issuer}" has no jwks_uri`);
            const { keys } = await this.localServer.getJwks();
            return [
                { kind: 'oauth2-authorization-server', fetchedAt, document },
                { kind: 'jwks', fetchedAt, url: document.jwks_uri, keys },
            ];
        }
        const documents = [];
        const { discovery } = authentication;
        if (discovery.mode === 'manual') {
            if (discovery.metadataUrl) {
                const fetched = await this.client.fetchOAuth2ServerMetadata({
                    issuer,
                    url: discovery.metadataUrl,
                });
                if (!fetched) {
                    throw new n8n_workflow_1.OperationalError(`Metadata URL "${discovery.metadataUrl}" offers no document`);
                }
                documents.push({
                    kind: 'oauth2-authorization-server',
                    fetchedAt,
                    document: fetched.document,
                });
            }
        }
        else {
            const [oidc, oauth2] = await Promise.all([
                this.client.fetchOpenIdConfiguration(issuer),
                this.client.fetchOAuth2ServerMetadata({ issuer }),
            ]);
            if (oidc)
                documents.push({ kind: 'openid-configuration', fetchedAt, document: oidc.document });
            if (oauth2) {
                documents.push({
                    kind: 'oauth2-authorization-server',
                    fetchedAt,
                    document: oauth2.document,
                });
            }
            if (documents.length === 0) {
                throw new n8n_workflow_1.OperationalError(`Issuer "${issuer}" offers no OAuth2 metadata document`);
            }
        }
        const { jwksUri } = (0, inbound_auth_1.resolveOAuth2Endpoints)(config, documents);
        if (!jwksUri)
            throw new n8n_workflow_1.OperationalError(`Issuer "${issuer}" has no jwks_uri`);
        const { keys } = await this.client.fetchJwks(jwksUri);
        documents.push({ kind: 'jwks', fetchedAt, url: jwksUri, keys });
        return documents;
    }
};
exports.TrustedSourceDiscoveryService = TrustedSourceDiscoveryService;
exports.TrustedSourceDiscoveryService = TrustedSourceDiscoveryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, trusted_source_store_1.TrustedSourceDbStore, backend_services_1.OAuthDiscoveryClient, inbound_auth_1.LocalAuthorizationServer])
], TrustedSourceDiscoveryService);
//# sourceMappingURL=trusted-source-discovery.service.js.map