"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalSecretsProviderRegistry = void 0;
const di_1 = require("@n8n/di");
let ExternalSecretsProviderRegistry = class ExternalSecretsProviderRegistry {
    constructor() {
        this.providers = new Map();
    }
    set(name, provider) {
        this.providers.set(name, provider);
    }
    remove(name) {
        this.providers.delete(name);
    }
    get(name) {
        return this.providers.get(name);
    }
    has(name) {
        return this.providers.has(name);
    }
    getAll() {
        return new Map(this.providers);
    }
    getConnected() {
        const result = new Map();
        for (const [name, provider] of this.providers) {
            if (provider.state === 'connected') {
                result.set(name, provider);
            }
        }
        return result;
    }
    getConnectedNames() {
        return Array.from(this.getConnected().keys());
    }
    getNames() {
        return Array.from(this.providers.keys());
    }
    clear() {
        this.providers.clear();
    }
    async disconnectAll() {
        const disconnectPromises = Array.from(this.providers.values()).map(async (provider) => await provider.disconnect().catch(() => {
        }));
        await Promise.all(disconnectPromises);
    }
};
exports.ExternalSecretsProviderRegistry = ExternalSecretsProviderRegistry;
exports.ExternalSecretsProviderRegistry = ExternalSecretsProviderRegistry = __decorate([
    (0, di_1.Service)()
], ExternalSecretsProviderRegistry);
//# sourceMappingURL=provider-registry.service.js.map