"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalAuthorizationServerProxy = void 0;
const di_1 = require("@n8n/di");
const inbound_auth_1 = require("@n8n/inbound-auth");
const n8n_workflow_1 = require("n8n-workflow");
let LocalAuthorizationServerProxy = class LocalAuthorizationServerProxy extends inbound_auth_1.LocalAuthorizationServer {
    constructor() {
        super(...arguments);
        this.listeners = [];
    }
    async registerProvider(provider) {
        this.provider = provider;
        for (const listener of this.listeners)
            await listener();
    }
    async onProviderRegistered(listener) {
        this.listeners.push(listener);
        if (this.provider)
            await listener();
    }
    async getMetadata() {
        return await this.required().getMetadata();
    }
    async getJwks() {
        return await this.required().getJwks();
    }
    async isAccessTokenActive(token) {
        return this.provider ? await this.provider.isAccessTokenActive(token) : false;
    }
    required() {
        if (!this.provider)
            throw new n8n_workflow_1.OperationalError('No local authorization server is registered');
        return this.provider;
    }
};
exports.LocalAuthorizationServerProxy = LocalAuthorizationServerProxy;
exports.LocalAuthorizationServerProxy = LocalAuthorizationServerProxy = __decorate([
    (0, di_1.Service)()
], LocalAuthorizationServerProxy);
//# sourceMappingURL=local-authorization-server.proxy.js.map