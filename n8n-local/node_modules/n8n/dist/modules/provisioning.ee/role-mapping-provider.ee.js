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
exports.ProvisioningRoleMappingProvider = void 0;
const di_1 = require("@n8n/di");
const provisioning_service_ee_1 = require("./provisioning.service.ee");
const role_resolver_service_ee_1 = require("./role-resolver.service.ee");
let ProvisioningRoleMappingProvider = class ProvisioningRoleMappingProvider {
    constructor(roleResolver, provisioning) {
        this.roleResolver = roleResolver;
        this.provisioning = provisioning;
    }
    async resolveRoles(config, context, ctx) {
        return await this.roleResolver.resolveRoles(config, context, ctx);
    }
    async applyResolvedRoles(user, resolved, managed) {
        await this.provisioning.applyResolvedRoles(user, resolved, managed);
    }
};
exports.ProvisioningRoleMappingProvider = ProvisioningRoleMappingProvider;
exports.ProvisioningRoleMappingProvider = ProvisioningRoleMappingProvider = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [role_resolver_service_ee_1.RoleResolverService, provisioning_service_ee_1.ProvisioningService])
], ProvisioningRoleMappingProvider);
//# sourceMappingURL=role-mapping-provider.ee.js.map