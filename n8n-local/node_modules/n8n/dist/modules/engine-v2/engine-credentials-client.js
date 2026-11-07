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
exports.EngineCredentialsClient = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const engine_control_plane_transport_1 = require("./engine-control-plane-transport");
const engine_credentials_contract_1 = require("./engine-credentials.contract");
const engine_v2_constants_1 = require("./engine-v2.constants");
let EngineCredentialsClient = class EngineCredentialsClient {
    constructor(transport) {
        this.http = transport.forScope('credentials:read');
    }
    async resolve(request, signal) {
        const response = await this.http.request({
            url: engine_v2_constants_1.CREDENTIALS_RESOLVE_PATH,
            method: 'POST',
            body: request,
            json: true,
            returnFullResponse: true,
            ignoreHttpStatusErrors: true,
            disableFollowRedirect: true,
            abortSignal: signal,
        });
        if (response.statusCode >= 300) {
            throw new n8n_workflow_1.OperationalError(`Control plane refused to resolve credential "${request.credential.id}" with ${response.statusCode}`);
        }
        if (!(0, engine_credentials_contract_1.isResolveCredentialResponse)(response.body)) {
            throw new n8n_workflow_1.OperationalError(`Control plane returned a malformed response for credential "${request.credential.id}"`);
        }
        return response.body.data;
    }
};
exports.EngineCredentialsClient = EngineCredentialsClient;
exports.EngineCredentialsClient = EngineCredentialsClient = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [engine_control_plane_transport_1.EngineControlPlaneTransport])
], EngineCredentialsClient);
//# sourceMappingURL=engine-credentials-client.js.map