"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProvisioningModule = void 0;
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
let ProvisioningModule = class ProvisioningModule {
    async init() {
        if (di_1.Container.get(n8n_core_1.InstanceSettings).instanceType === 'main') {
            await import('./provisioning.controller.ee.js');
            await import('./role-mapping-rule.controller.ee.js');
        }
        const { RoleDeletionCheckProxy } = await import('@n8n/backend-services');
        const { ProvisioningRoleDeletionChecker } = await import('./role-deletion-checker.ee.js');
        di_1.Container.get(RoleDeletionCheckProxy).registerProvider(di_1.Container.get(ProvisioningRoleDeletionChecker));
        const { RoleMappingProxyService } = await import('@n8n/backend-services/auth');
        const { ProvisioningRoleMappingProvider } = await import('./role-mapping-provider.ee.js');
        di_1.Container.get(RoleMappingProxyService).registerProvider(di_1.Container.get(ProvisioningRoleMappingProvider));
    }
};
exports.ProvisioningModule = ProvisioningModule;
exports.ProvisioningModule = ProvisioningModule = __decorate([
    (0, decorators_1.BackendModule)({
        name: 'provisioning',
        licenseFlag: ['feat:oidc', 'feat:saml', 'feat:ldap'],
        instanceTypes: ['main', 'webhook', 'worker'],
    })
], ProvisioningModule);
//# sourceMappingURL=provisioning.module.js.map