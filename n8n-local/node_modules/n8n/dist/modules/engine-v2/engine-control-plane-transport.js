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
exports.EngineControlPlaneTransport = void 0;
const backend_network_1 = require("@n8n/backend-network");
const config_1 = require("@n8n/config");
const di_1 = require("@n8n/di");
const engine_1 = require("@n8n/engine");
let EngineControlPlaneTransport = class EngineControlPlaneTransport {
    constructor(engineConfig, outboundHttp) {
        this.engineConfig = engineConfig;
        this.outboundHttp = outboundHttp;
    }
    forScope(scope) {
        return this.outboundHttp.requests({
            useDefaultSsrfPolicy: 'unsafe',
            baseURL: this.engineConfig.controlPlaneBaseUrl ||
                `http://127.0.0.1:${this.engineConfig.controlPlanePort}`,
            headers: () => ({
                authorization: `Bearer ${(0, engine_1.mintActionToken)(this.engineConfig.authSecret, scope)}`,
            }),
        });
    }
};
exports.EngineControlPlaneTransport = EngineControlPlaneTransport;
exports.EngineControlPlaneTransport = EngineControlPlaneTransport = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [config_1.EngineConfig, backend_network_1.OutboundHttp])
], EngineControlPlaneTransport);
//# sourceMappingURL=engine-control-plane-transport.js.map