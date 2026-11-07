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
exports.OAuth2FlowService = void 0;
exports.encodeRefreshGrant = encodeRefreshGrant;
exports.decodeRefreshGrant = decodeRefreshGrant;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const backend_services_1 = require("@n8n/backend-services");
const auth_1 = require("@n8n/backend-services/auth");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const get_jwt_expiry_1 = require("@n8n/utils/get-jwt-expiry");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
const pkce_challenge_1 = __importDefault(require("pkce-challenge"));
const zod_1 = require("zod");
const constants_2 = require("../../modules/inbound-auth-core/constants");
const oauth_server_service_1 = require("./oauth-server.service");
const FLOW_STATE_PREFIX = 'oauth-flow:';
const FLOW_STATE_TTL = 5 * constants_1.Time.minutes.toMilliseconds;
const TOKEN_REQUEST_TIMEOUT_MS = 10 * constants_1.Time.seconds.toMilliseconds;
const REDIRECT_LOGIN = 'redirect-login';
function acceptedSourceOf(resource) {
    const accepted = resource.getAcceptedSourceIds?.() ?? [constants_2.SYSTEM_TRUSTED_SOURCE_ID];
    if (accepted.length !== 1) {
        throw new n8n_workflow_1.UnexpectedError(`A redirect login needs exactly one accepted trusted source, resource ${resource.id} has ${accepted.length}`);
    }
    return accepted[0];
}
function encodeRefreshGrant(sourceId, refreshToken) {
    return Buffer.from(JSON.stringify({ sourceId, refreshToken })).toString('base64url');
}
function decodeRefreshGrant(grant) {
    let parsed;
    try {
        parsed = JSON.parse(Buffer.from(grant, 'base64url').toString());
    }
    catch {
        return undefined;
    }
    if (!(0, is_record_1.isRecord)(parsed) ||
        typeof parsed.sourceId !== 'string' ||
        typeof parsed.refreshToken !== 'string') {
        return undefined;
    }
    return { sourceId: parsed.sourceId, refreshToken: parsed.refreshToken };
}
const TokenResponseSchema = zod_1.z
    .object({
    access_token: zod_1.z.string().min(1),
    expires_in: zod_1.z.number().int().positive().optional(),
    refresh_token: zod_1.z.string().min(1).optional(),
})
    .passthrough();
function tokenErrorCode(body) {
    return (0, is_record_1.isRecord)(body) && typeof body.error === 'string' ? body.error : undefined;
}
function secondsUntilExpiry(token) {
    const exp = (0, get_jwt_expiry_1.getJwtExpiry)(token);
    return exp === undefined ? undefined : Math.max(0, exp - Math.floor(Date.now() / 1000));
}
let OAuth2FlowService = class OAuth2FlowService {
    constructor(oauthServerService, resourceRegistry, cacheService, store, admission, outboundHttp, logger) {
        this.oauthServerService = oauthServerService;
        this.resourceRegistry = resourceRegistry;
        this.cacheService = cacheService;
        this.store = store;
        this.admission = admission;
        this.http = outboundHttp.requests({
            useDefaultSsrfPolicy: 'enforced',
            timeout: TOKEN_REQUEST_TIMEOUT_MS,
        });
        this.logger = logger.scoped('inbound-auth');
    }
    async begin(resourceUrl, metadata) {
        const resource = await this.resourceRegistry.getByResourceUrl(resourceUrl);
        if (!resource?.isFirstParty) {
            throw new n8n_workflow_1.UserError(`Not a first-party protected resource: ${resourceUrl}`);
        }
        const login = await this.redirectLoginOf(acceptedSourceOf(resource), resource.surface);
        if (!login.ok)
            throw new n8n_workflow_1.UserError(login.reason);
        const { source, authorizationEndpoint, client } = login.value;
        const { code_verifier, code_challenge } = await (0, pkce_challenge_1.default)();
        const state = (0, node_crypto_1.randomBytes)(32).toString('hex');
        await this.cacheService.set(FLOW_STATE_PREFIX + state, {
            codeVerifier: code_verifier,
            resourceUrl,
            sourceId: source.id,
            metadata,
        }, FLOW_STATE_TTL);
        const url = new URL(authorizationEndpoint);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('client_id', client.kind === 'virtual' ? resourceUrl : client.clientId);
        url.searchParams.set('redirect_uri', resourceUrl);
        url.searchParams.set('resource', resourceUrl);
        url.searchParams.set('code_challenge', code_challenge);
        url.searchParams.set('code_challenge_method', 'S256');
        url.searchParams.set('state', state);
        if (client.kind === 'registered' && client.scopes?.length) {
            url.searchParams.set('scope', client.scopes.join(' '));
        }
        return url.toString();
    }
    async complete(code, state, request) {
        const cacheKey = FLOW_STATE_PREFIX + state;
        const flow = await this.cacheService.get(cacheKey);
        if (!flow)
            return { valid: false, reason: 'invalid_state' };
        await this.cacheService.delete(cacheKey);
        const { codeVerifier, resourceUrl, sourceId, metadata } = flow;
        const resource = await this.resourceRegistry.getByResourceUrl(resourceUrl);
        if (!resource?.isFirstParty)
            return { valid: false, reason: 'invalid_client' };
        const accepted = acceptedSourceOf(resource);
        if (accepted !== sourceId) {
            this.logger.warn('Redirect login completed against another trusted source than it began', {
                began: sourceId,
                accepted,
            });
            return { valid: false, reason: 'invalid_state' };
        }
        const login = await this.redirectLoginOf(sourceId, resource.surface);
        if (!login.ok) {
            this.logger.warn('Redirect login cannot complete', { sourceId, reason: login.reason });
            return { valid: false, reason: 'source_unusable' };
        }
        const issued = login.value.client.kind === 'virtual'
            ? await this.exchangeWithVirtualClient(resourceUrl, code, codeVerifier)
            : await this.exchangeWithRegisteredClient(login.value, resourceUrl, code, codeVerifier);
        if (!issued.ok)
            return { valid: false, reason: issued.reason };
        const tokens = issued.value;
        const admitted = await this.admission.admitBearer(resource, {
            method: request?.method ?? 'GET',
            url: request?.url ?? resourceUrl,
            ip: request?.ip ?? '',
        }, tokens.accessToken);
        if (!admitted.ok)
            return { valid: false, reason: admitted.reason };
        const { context } = admitted;
        const expiresIn = tokens.expiresIn ?? secondsUntilExpiry(tokens.accessToken);
        if (expiresIn === undefined)
            return { valid: false, reason: 'invalid_grant' };
        const { subject } = context;
        return {
            valid: true,
            token: tokens.accessToken,
            refreshToken: tokens.refreshToken === undefined
                ? undefined
                : encodeRefreshGrant(sourceId, tokens.refreshToken),
            expiresIn,
            user: {
                id: subject.id,
                email: subject.email ?? '',
                firstName: subject.firstName ?? '',
                lastName: subject.lastName ?? '',
            },
            metadata,
        };
    }
    async refresh(grant, resourceUrl) {
        const resource = await this.resourceRegistry.getByResourceUrl(resourceUrl);
        if (!resource?.isFirstParty) {
            throw new n8n_workflow_1.UserError(`Not a first-party protected resource: ${resourceUrl}`);
        }
        const issued = decodeRefreshGrant(grant);
        if (!issued)
            return { valid: false, reason: 'invalid_grant' };
        const accepted = acceptedSourceOf(resource);
        if (issued.sourceId !== accepted) {
            this.logger.warn('Refresh grant presented against another trusted source than issued it', {
                issued: issued.sourceId,
                accepted,
            });
            return { valid: false, reason: 'invalid_grant' };
        }
        const login = await this.redirectLoginOf(accepted, resource.surface);
        if (!login.ok) {
            this.logger.warn('Redirect login cannot refresh', { reason: login.reason });
            return { valid: false, reason: 'source_unusable' };
        }
        const refreshed = login.value.client.kind === 'virtual'
            ? await this.refreshWithVirtualClient(issued.refreshToken, resourceUrl)
            : await this.refreshWithRegisteredClient(login.value, issued.refreshToken, resourceUrl);
        if (!refreshed.valid)
            return refreshed;
        return { ...refreshed, refreshToken: encodeRefreshGrant(accepted, refreshed.refreshToken) };
    }
    async refreshWithVirtualClient(refreshToken, resourceUrl) {
        const client = await this.oauthServerService.clientsStore.getClient(resourceUrl);
        if (!client)
            return { valid: false, reason: 'invalid_client' };
        try {
            const tokens = await this.oauthServerService.exchangeRefreshToken(client, refreshToken, undefined, new URL(resourceUrl));
            if (!tokens.refresh_token || tokens.expires_in === undefined) {
                return { valid: false, reason: 'invalid_grant' };
            }
            return {
                valid: true,
                token: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresIn: tokens.expires_in,
            };
        }
        catch (error) {
            if (error instanceof errors_js_1.InvalidGrantError || error instanceof errors_js_1.InvalidTargetError) {
                return { valid: false, reason: 'invalid_grant' };
            }
            throw error;
        }
    }
    async refreshWithRegisteredClient(login, refreshToken, resourceUrl) {
        const body = new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            resource: resourceUrl,
        });
        const issued = await this.requestTokens(login, body, 'refresh token');
        if (!issued.ok)
            return { valid: false, reason: issued.reason };
        const { accessToken } = issued.value;
        const expiresIn = issued.value.expiresIn ?? secondsUntilExpiry(accessToken);
        if (expiresIn === undefined)
            return { valid: false, reason: 'invalid_grant' };
        return {
            valid: true,
            token: accessToken,
            refreshToken: issued.value.refreshToken ?? refreshToken,
            expiresIn,
        };
    }
    async redirectLoginOf(sourceId, surface) {
        const source = await this.store.getById(sourceId);
        if (!source)
            return { ok: false, reason: `Unknown trusted source: ${sourceId}` };
        if (source.config.surfaces[surface] === undefined) {
            return {
                ok: false,
                reason: `Trusted source "${source.name}" is not accepted on the ${surface} surface`,
            };
        }
        if (!(0, inbound_auth_1.deriveCapabilities)(source.config, source.metadata).has(REDIRECT_LOGIN)) {
            return {
                ok: false,
                reason: `Trusted source "${source.name}" has no ${REDIRECT_LOGIN} capability: it needs an authorization endpoint, a token endpoint and a client`,
            };
        }
        const { authentication } = source.config;
        const { authorizationEndpoint, tokenEndpoint } = (0, inbound_auth_1.resolveOAuth2Endpoints)(source.config, source.metadata?.documents ?? []);
        if (authentication.type !== 'oauth2' ||
            !authentication.client ||
            !authorizationEndpoint ||
            !tokenEndpoint) {
            throw new n8n_workflow_1.UnexpectedError(`Trusted source ${source.id} has ${REDIRECT_LOGIN} without its endpoints`);
        }
        return {
            ok: true,
            value: { source, authorizationEndpoint, tokenEndpoint, client: authentication.client },
        };
    }
    async exchangeWithVirtualClient(resourceUrl, code, codeVerifier) {
        const client = await this.oauthServerService.clientsStore.getClient(resourceUrl);
        if (!client)
            return { ok: false, reason: 'invalid_client' };
        try {
            const challenge = await this.oauthServerService.challengeForAuthorizationCode(client, code);
            if ((0, node_crypto_1.createHash)('sha256').update(codeVerifier).digest('base64url') !== challenge) {
                return { ok: false, reason: 'invalid_grant' };
            }
            const tokens = await this.oauthServerService.exchangeAuthorizationCode(client, code, codeVerifier, resourceUrl, new URL(resourceUrl));
            return {
                ok: true,
                value: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    expiresIn: tokens.expires_in,
                },
            };
        }
        catch (error) {
            if (error instanceof errors_js_1.InvalidGrantError) {
                return { ok: false, reason: 'invalid_grant' };
            }
            throw error;
        }
    }
    async exchangeWithRegisteredClient(login, resourceUrl, code, codeVerifier) {
        const body = new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: resourceUrl,
            code_verifier: codeVerifier,
            resource: resourceUrl,
        });
        return await this.requestTokens(login, body, 'authorization code');
    }
    async requestTokens({ source, tokenEndpoint, client }, body, grant) {
        if (client.kind !== 'registered') {
            throw new n8n_workflow_1.UnexpectedError('A virtual client cannot request tokens over HTTP');
        }
        const headers = {
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
        };
        if (client.clientSecret) {
            const credentials = `${encodeURIComponent(client.clientId)}:${encodeURIComponent(client.clientSecret)}`;
            headers.authorization = `Basic ${Buffer.from(credentials).toString('base64')}`;
        }
        else {
            body.set('client_id', client.clientId);
        }
        const response = await this.http.request({
            url: tokenEndpoint,
            method: 'POST',
            headers,
            body: body.toString(),
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
        });
        if (response.statusCode < 200 || response.statusCode >= 300) {
            this.logger.warn(`Token endpoint refused the ${grant}`, {
                sourceId: source.id,
                status: response.statusCode,
                error: tokenErrorCode(response.body),
            });
            return { ok: false, reason: 'invalid_grant' };
        }
        const parsed = TokenResponseSchema.safeParse(response.body);
        if (!parsed.success) {
            this.logger.warn('Token endpoint answered without an access token', {
                sourceId: source.id,
            });
            return { ok: false, reason: 'invalid_grant' };
        }
        return {
            ok: true,
            value: {
                accessToken: parsed.data.access_token,
                refreshToken: parsed.data.refresh_token,
                expiresIn: parsed.data.expires_in,
            },
        };
    }
};
exports.OAuth2FlowService = OAuth2FlowService;
exports.OAuth2FlowService = OAuth2FlowService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [oauth_server_service_1.OAuthServerService, auth_1.ProtectedResourceRegistry, backend_services_1.CacheService, inbound_auth_1.TrustedSourceStore, inbound_auth_1.ResourceAdmission, backend_network_1.OutboundHttp, backend_common_1.Logger])
], OAuth2FlowService);
//# sourceMappingURL=oauth-flow.service.js.map