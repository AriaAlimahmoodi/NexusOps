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
exports.odataLiteral = exports.TeamsGraphService = void 0;
exports.graphErrorCode = graphErrorCode;
exports.graphErrorMessage = graphErrorMessage;
exports.graphInnerErrorCode = graphInnerErrorCode;
exports.describeGraphError = describeGraphError;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const integration_helpers_1 = require("../../integration-helpers");
const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
const GRAPH_TIMEOUT_MS = 30_000;
function graphUrl(path) {
    let parsed;
    try {
        parsed = new URL(`${GRAPH_BASE_URL}${path}`);
    }
    catch {
        throw new n8n_workflow_1.UnexpectedError('Refusing to send a Microsoft Graph token to a path that is not a URL.');
    }
    if (!parsed.href.startsWith(`${GRAPH_BASE_URL}/`)) {
        throw new n8n_workflow_1.UnexpectedError('Refusing to send a Microsoft Graph token elsewhere.');
    }
    return parsed.href;
}
let TeamsGraphService = class TeamsGraphService {
    constructor(outboundHttp, logger) {
        this.outboundHttp = outboundHttp;
        this.logger = logger;
    }
    async request(accessToken, method, path, body, headers = {}) {
        const response = await this.outboundHttp
            .requests({ useDefaultSsrfPolicy: 'unsafe' })
            .request({
            method,
            url: graphUrl(path),
            headers: {
                authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
                ...headers,
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            timeout: GRAPH_TIMEOUT_MS,
        });
        const ok = response.statusCode >= 200 && response.statusCode < 300;
        if (!ok) {
            this.logger.debug('[TeamsGraph] Graph refused a call', {
                method,
                path,
                statusCode: response.statusCode,
                error: describeGraphError(response.body) ?? graphErrorCode(response.body),
            });
        }
        return { statusCode: response.statusCode, body: response.body, ok };
    }
    async postZip(accessToken, path, archive) {
        const response = await this.outboundHttp
            .requests({ useDefaultSsrfPolicy: 'unsafe' })
            .request({
            method: 'POST',
            url: graphUrl(path),
            headers: {
                authorization: `Bearer ${accessToken}`,
                'content-type': 'application/zip',
            },
            body: archive,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            timeout: GRAPH_TIMEOUT_MS,
        });
        const ok = response.statusCode >= 200 && response.statusCode < 300;
        if (!ok) {
            this.logger.warn('[TeamsGraph] Graph refused the app package', {
                path,
                statusCode: response.statusCode,
                error: describeGraphError(response.body) ?? graphErrorCode(response.body),
            });
        }
        return { statusCode: response.statusCode, body: response.body, ok };
    }
};
exports.TeamsGraphService = TeamsGraphService;
exports.TeamsGraphService = TeamsGraphService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_network_1.OutboundHttp, backend_common_1.Logger])
], TeamsGraphService);
const odataLiteral = (value) => value.replace(/'/g, "''");
exports.odataLiteral = odataLiteral;
function graphErrorCode(body) {
    if (!(0, is_record_1.isRecord)(body))
        return undefined;
    const error = body.error;
    return (0, is_record_1.isRecord)(error) ? (0, integration_helpers_1.stringProperty)(error, 'code') : undefined;
}
function graphErrorMessage(body) {
    if (!(0, is_record_1.isRecord)(body))
        return undefined;
    const error = body.error;
    return (0, is_record_1.isRecord)(error) ? (0, integration_helpers_1.stringProperty)(error, 'message') : undefined;
}
function graphInnerErrorCode(body) {
    if (!(0, is_record_1.isRecord)(body))
        return undefined;
    const error = body.error;
    if (!(0, is_record_1.isRecord)(error))
        return undefined;
    const inner = error.innerError;
    return (0, is_record_1.isRecord)(inner) ? (0, integration_helpers_1.stringProperty)(inner, 'code') : undefined;
}
function describeGraphError(body) {
    const parts = [graphInnerErrorCode(body) ?? graphErrorCode(body), graphErrorMessage(body)].filter((part) => typeof part === 'string' && part.length > 0);
    return parts.length > 0 ? parts.join(': ') : undefined;
}
//# sourceMappingURL=teams-graph.service.js.map