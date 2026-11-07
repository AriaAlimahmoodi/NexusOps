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
exports.WhatsAppCredentialCheckService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const is_record_1 = require("@n8n/utils/is-record");
const sanitize_error_detail_1 = require("@n8n/utils/redaction/sanitize-error-detail");
const node_crypto_1 = require("node:crypto");
const agent_credential_lookup_service_1 = require("../../agent-credential-lookup.service");
const integration_helpers_1 = require("../../integration-helpers");
const WHATSAPP_CREDENTIAL_TYPE = 'whatsAppBotApi';
const GRAPH_API_BASE_URL = 'https://graph.facebook.com/v25.0';
const TEMPORARY_TOKEN_WINDOW_MS = 48 * 60 * 60 * 1000;
const CHECK_TIMEOUT_MS = 30_000;
const MAX_LOGGED_ERROR_LENGTH = 500;
let WhatsAppCredentialCheckService = class WhatsAppCredentialCheckService {
    constructor(credentialLookup, outboundHttp, logger, agentsConfig) {
        this.credentialLookup = credentialLookup;
        this.outboundHttp = outboundHttp;
        this.logger = logger;
        this.agentsConfig = agentsConfig;
    }
    async check(user, projectId, credentialId) {
        const data = await this.credentialLookup.decryptForUser(user, projectId, credentialId, WHATSAPP_CREDENTIAL_TYPE);
        if (!data)
            throw new errors_1.NotFoundError(`WhatsApp credential "${credentialId}" not found`);
        const accessToken = (0, integration_helpers_1.stringProperty)(data, 'accessToken')?.trim();
        const phoneNumberId = (0, integration_helpers_1.stringProperty)(data, 'phoneNumberId')?.trim();
        const businessAccountId = (0, integration_helpers_1.stringProperty)(data, 'businessAccountId')?.trim();
        const appSecret = (0, integration_helpers_1.stringProperty)(data, 'appSecret')?.trim();
        if (!accessToken || !phoneNumberId || !businessAccountId || !appSecret) {
            return { status: 'failed', reason: 'incomplete' };
        }
        const proof = (0, node_crypto_1.createHmac)('sha256', appSecret).update(accessToken).digest('hex');
        const get = async (path, qs = {}) => await this.get(path, accessToken, { ...qs, appsecret_proof: proof });
        try {
            const phone = await get(`/${encodeURIComponent(phoneNumberId)}`, {
                fields: 'display_phone_number,verified_name',
            });
            if (phone.statusCode !== 200)
                return this.refused('phone number', phone);
            const [expiresAt, accountNumbers, profile] = await Promise.all([
                this.tokenExpiry(accessToken, proof),
                get(`/${encodeURIComponent(businessAccountId)}/phone_numbers`, {
                    fields: 'id',
                    limit: '100',
                }),
                get(`/${encodeURIComponent(phoneNumberId)}/whatsapp_business_profile`, {
                    fields: 'about,description,profile_picture_url',
                }).catch(() => undefined),
            ]);
            if (expiresAt !== undefined &&
                expiresAt - Date.now() < TEMPORARY_TOKEN_WINDOW_MS &&
                !this.agentsConfig.whatsAppAllowTemporaryToken) {
                return { status: 'failed', reason: 'temporaryToken' };
            }
            if (accountNumbers.statusCode !== 200) {
                return this.refused('business account', accountNumbers);
            }
            if (!listedIds(accountNumbers.body).includes(phoneNumberId)) {
                this.logger.debug('[WhatsAppCredentialCheck] Phone number is not in the business account');
                return { status: 'failed', reason: 'mismatch' };
            }
            return {
                status: 'ok',
                profile: toProfile(phone.body, profile?.statusCode === 200 ? profile.body : undefined),
            };
        }
        catch (error) {
            this.logger.debug('[WhatsAppCredentialCheck] Could not reach Meta', {
                error: (0, sanitize_error_detail_1.sanitizeErrorDetail)((0, ensure_error_1.ensureError)(error).message, MAX_LOGGED_ERROR_LENGTH),
            });
            return { status: 'failed', reason: 'unreachable' };
        }
    }
    async tokenExpiry(accessToken, proof) {
        try {
            const response = await this.get('/debug_token', accessToken, {
                input_token: accessToken,
                appsecret_proof: proof,
            });
            const data = (0, is_record_1.isRecord)(response.body) ? response.body.data : undefined;
            const expiresAt = (0, integration_helpers_1.numberProperty)(data, 'expires_at');
            return expiresAt ? expiresAt * 1000 : undefined;
        }
        catch {
            return undefined;
        }
    }
    refused(target, response) {
        if (response.statusCode >= 500)
            return { status: 'failed', reason: 'unreachable' };
        const error = (0, is_record_1.isRecord)(response.body) ? response.body.error : undefined;
        this.logger.debug(`[WhatsAppCredentialCheck] Meta refused the ${target} request`, {
            statusCode: response.statusCode,
            code: (0, integration_helpers_1.numberProperty)(error, 'code'),
        });
        return { status: 'failed', reason: 'mismatch' };
    }
    async get(path, accessToken, qs) {
        return await this.outboundHttp
            .requests({ useDefaultSsrfPolicy: 'unsafe' })
            .request({
            method: 'GET',
            url: `${GRAPH_API_BASE_URL}${path}`,
            qs,
            headers: { Authorization: `Bearer ${accessToken}` },
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            timeout: CHECK_TIMEOUT_MS,
        });
    }
};
exports.WhatsAppCredentialCheckService = WhatsAppCredentialCheckService;
exports.WhatsAppCredentialCheckService = WhatsAppCredentialCheckService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [agent_credential_lookup_service_1.AgentCredentialLookupService, backend_network_1.OutboundHttp, backend_common_1.Logger, config_1.AgentsConfig])
], WhatsAppCredentialCheckService);
function listedIds(body) {
    const data = (0, is_record_1.isRecord)(body) && Array.isArray(body.data) ? body.data : [];
    return data
        .map((entry) => (0, integration_helpers_1.stringProperty)(entry, 'id'))
        .filter((id) => id !== undefined);
}
function toProfile(phone, profileBody) {
    const profile = (0, is_record_1.isRecord)(profileBody) && Array.isArray(profileBody.data) ? profileBody.data[0] : undefined;
    return {
        verifiedName: (0, integration_helpers_1.stringProperty)(phone, 'verified_name'),
        displayPhoneNumber: (0, integration_helpers_1.stringProperty)(phone, 'display_phone_number'),
        description: (0, integration_helpers_1.stringProperty)(profile, 'description') ?? (0, integration_helpers_1.stringProperty)(profile, 'about'),
        profilePictureUrl: (0, integration_helpers_1.stringProperty)(profile, 'profile_picture_url'),
    };
}
//# sourceMappingURL=whatsapp-credential-check.service.js.map