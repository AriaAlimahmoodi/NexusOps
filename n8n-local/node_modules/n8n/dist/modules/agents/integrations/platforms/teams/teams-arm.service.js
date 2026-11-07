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
exports.TeamsArmService = void 0;
exports.armNextLinkPath = armNextLinkPath;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const teams_graph_service_1 = require("./teams-graph.service");
const ARM_BASE_URL = 'https://management.azure.com';
const ARM_TIMEOUT_MS = 60_000;
function armUrl(path) {
    let parsed;
    try {
        parsed = new URL(`${ARM_BASE_URL}${path}`);
    }
    catch {
        throw new n8n_workflow_1.UnexpectedError('Refusing to send an Azure token to a path that is not a URL.');
    }
    if (parsed.origin !== ARM_BASE_URL) {
        throw new n8n_workflow_1.UnexpectedError('Refusing to send an Azure token off Azure Resource Manager.');
    }
    return parsed.href;
}
function armNextLinkPath(nextLink) {
    try {
        const url = new URL(nextLink);
        if (url.origin !== ARM_BASE_URL)
            return undefined;
        return `${url.pathname}${url.search}`;
    }
    catch {
        return undefined;
    }
}
let TeamsArmService = class TeamsArmService {
    constructor(outboundHttp, logger) {
        this.outboundHttp = outboundHttp;
        this.logger = logger;
    }
    async request(accessToken, method, path, body) {
        const url = armUrl(path);
        const response = await this.outboundHttp
            .requests({ useDefaultSsrfPolicy: 'unsafe' })
            .request({
            method,
            url,
            headers: {
                authorization: `Bearer ${accessToken}`,
                'content-type': 'application/json',
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            timeout: ARM_TIMEOUT_MS,
        });
        const ok = response.statusCode >= 200 && response.statusCode < 300;
        if (!ok) {
            this.logger.debug('[TeamsArm] Azure refused a call', {
                method,
                path,
                statusCode: response.statusCode,
                error: (0, teams_graph_service_1.graphErrorCode)(response.body),
            });
        }
        return { statusCode: response.statusCode, body: response.body, ok };
    }
};
exports.TeamsArmService = TeamsArmService;
exports.TeamsArmService = TeamsArmService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_network_1.OutboundHttp, backend_common_1.Logger])
], TeamsArmService);
//# sourceMappingURL=teams-arm.service.js.map