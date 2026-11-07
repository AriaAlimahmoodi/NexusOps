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
exports.ProvisioningRoleDeletionChecker = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const provisioning_service_ee_1 = require("./provisioning.service.ee");
let ProvisioningRoleDeletionChecker = class ProvisioningRoleDeletionChecker {
    constructor(roleMappingRuleRepository, provisioningService) {
        this.roleMappingRuleRepository = roleMappingRuleRepository;
        this.provisioningService = provisioningService;
    }
    async findRoleDeletionBlockers(roleSlug) {
        const blockers = [];
        const count = await this.roleMappingRuleRepository.count({
            where: { role: { slug: roleSlug } },
        });
        if (count > 0) {
            blockers.push(`referenced by ${count} role mapping rule${count === 1 ? '' : 's'}`);
        }
        const { defaultInstanceRole } = await this.provisioningService.getConfig();
        if (defaultInstanceRole === roleSlug) {
            blockers.push('configured as the role mapping default condition role');
        }
        return blockers;
    }
};
exports.ProvisioningRoleDeletionChecker = ProvisioningRoleDeletionChecker;
exports.ProvisioningRoleDeletionChecker = ProvisioningRoleDeletionChecker = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.RoleMappingRuleRepository, provisioning_service_ee_1.ProvisioningService])
], ProvisioningRoleDeletionChecker);
//# sourceMappingURL=role-deletion-checker.ee.js.map