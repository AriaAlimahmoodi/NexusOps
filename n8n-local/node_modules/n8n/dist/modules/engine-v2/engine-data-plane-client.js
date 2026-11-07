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
exports.EngineDataPlaneClient = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const engine_1 = require("@n8n/engine");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const engine_data_plane_proxy_service_1 = require("../../services/engine-data-plane-proxy.service");
const notCancellableDetailsSchema = zod_1.z.object({
    status: zod_1.z.enum(['queued', 'running', 'waiting', 'completed', 'failed', 'cancelled']),
});
let EngineDataPlaneClient = class EngineDataPlaneClient {
    constructor(engineConfig, outboundHttp, instanceSettings) {
        this.engineConfig = engineConfig;
        this.instanceSettings = instanceSettings;
        this.http = outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            baseURL: engineConfig.baseUrl || `http://127.0.0.1:${engineConfig.port}`,
            headers: () => ({
                authorization: `Bearer ${(0, engine_1.mintIdentityToken)(this.engineConfig.authSecret, this.caller())}`,
            }),
        });
    }
    caller() {
        const { instanceId } = this.instanceSettings;
        return { cpId: instanceId, tenantId: instanceId };
    }
    async startExecution(request) {
        const response = await this.http.request({
            url: '/api/workflow-executions',
            method: 'POST',
            body: request,
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            disableFollowRedirect: true,
        });
        if (response.statusCode >= 300)
            throw this.toError(response.statusCode, response.body);
        return response.body;
    }
    async getExecution(id, options) {
        const response = await this.http.request({
            url: `/api/workflow-executions/${encodeURIComponent(id)}`,
            method: 'GET',
            qs: options?.includeSteps ? { includeSteps: 'true' } : undefined,
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            disableFollowRedirect: true,
        });
        if (response.statusCode === 404)
            return undefined;
        if (response.statusCode >= 300)
            throw this.toError(response.statusCode, response.body);
        return response.body;
    }
    async searchExecutions(request) {
        const response = await this.http.request({
            url: '/api/workflow-executions/search',
            method: 'POST',
            body: request,
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            disableFollowRedirect: true,
        });
        if (response.statusCode >= 300)
            throw this.toError(response.statusCode, response.body);
        return response.body;
    }
    async cancelExecution(id) {
        const response = await this.http.request({
            url: `/api/workflow-executions/${encodeURIComponent(id)}/cancel`,
            method: 'POST',
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            disableFollowRedirect: true,
        });
        if (response.statusCode === 404)
            return undefined;
        if (response.statusCode === 409) {
            return { cancelled: false, status: this.endedStatus(response.body) };
        }
        if (response.statusCode >= 300)
            throw this.toError(response.statusCode, response.body);
        const { finishedAt } = response.body;
        return { cancelled: true, finishedAt: new Date(finishedAt) };
    }
    endedStatus(body) {
        const parsed = notCancellableDetailsSchema.safeParse(this.parseErrorResponse(body).details);
        if (!parsed.success) {
            throw new n8n_workflow_1.OperationalError('Engine refused to cancel the execution without naming its status');
        }
        return parsed.data.status;
    }
    toError(statusCode, body) {
        const { error, reason } = this.parseErrorResponse(body);
        const detail = reason ?? error;
        const suffix = detail ? `: ${detail}` : '';
        switch (statusCode) {
            case 400:
                return new engine_data_plane_proxy_service_1.EngineRejectedWorkflowError(`Engine rejected the workflow${suffix}`);
            case 429:
                return new engine_data_plane_proxy_service_1.EngineDidNotAdmitError(`Engine did not admit the execution${suffix}`);
            case 501:
                return new engine_data_plane_proxy_service_1.EngineRejectedWorkflowError(`Engine does not support this workflow yet${suffix}`);
            default:
                return new n8n_workflow_1.OperationalError(`Engine responded with ${statusCode}${suffix}`);
        }
    }
    parseErrorResponse(body) {
        if (!(0, backend_common_1.isObjectLiteral)(body))
            return {};
        return body;
    }
};
exports.EngineDataPlaneClient = EngineDataPlaneClient;
exports.EngineDataPlaneClient = EngineDataPlaneClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.EngineConfig, backend_network_1.OutboundHttp, n8n_core_1.InstanceSettings])
], EngineDataPlaneClient);
//# sourceMappingURL=engine-data-plane-client.js.map