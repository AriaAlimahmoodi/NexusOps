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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleMappingRuleController = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const decorators_1 = require("@n8n/decorators");
const role_mapping_rule_service_ee_1 = require("./role-mapping-rule.service.ee");
let RoleMappingRuleController = class RoleMappingRuleController {
    constructor(roleMappingRuleService, licenseState) {
        this.roleMappingRuleService = roleMappingRuleService;
        this.licenseState = licenseState;
    }
    async list(_req, res, query) {
        if (!this.licenseState.isProvisioningLicensed()) {
            return res.status(403).json({ message: 'Provisioning is not licensed' });
        }
        return await this.roleMappingRuleService.list(query);
    }
    async create(req, res, body) {
        if (!this.licenseState.isProvisioningLicensed()) {
            return res.status(403).json({ message: 'Provisioning is not licensed' });
        }
        return await this.roleMappingRuleService.create(body, req.user);
    }
    async move(req, res, body, id) {
        if (!this.licenseState.isProvisioningLicensed()) {
            return res.status(403).json({ message: 'Provisioning is not licensed' });
        }
        return await this.roleMappingRuleService.move({
            id,
            targetIndex: body.targetIndex,
            userId: req.user.id,
            userEmail: req.user.email,
        });
    }
    async patch(req, res, body, id) {
        if (!this.licenseState.isProvisioningLicensed()) {
            return res.status(403).json({ message: 'Provisioning is not licensed' });
        }
        return await this.roleMappingRuleService.patch({
            id,
            dto: body,
            userId: req.user.id,
            userEmail: req.user.email,
        });
    }
    async delete(req, res, id) {
        if (!this.licenseState.isProvisioningLicensed()) {
            return res.status(403).json({ message: 'Provisioning is not licensed' });
        }
        await this.roleMappingRuleService.delete({
            id,
            userId: req.user.id,
            userEmail: req.user.email,
        });
        return { success: true };
    }
};
exports.RoleMappingRuleController = RoleMappingRuleController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('roleMappingRule:list'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListRoleMappingRuleQueryDto]),
    __metadata("design:returntype", Promise)
], RoleMappingRuleController.prototype, "list", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('roleMappingRule:create'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateRoleMappingRuleDto]),
    __metadata("design:returntype", Promise)
], RoleMappingRuleController.prototype, "create", null);
__decorate([
    (0, decorators_1.Post)('/:id/move'),
    (0, decorators_1.GlobalScope)('roleMappingRule:update'),
    __param(2, decorators_1.Body),
    __param(3, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.MoveRoleMappingRuleDto, String]),
    __metadata("design:returntype", Promise)
], RoleMappingRuleController.prototype, "move", null);
__decorate([
    (0, decorators_1.Patch)('/:id'),
    (0, decorators_1.GlobalScope)('roleMappingRule:update'),
    __param(2, decorators_1.Body),
    __param(3, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.PatchRoleMappingRuleDto, String]),
    __metadata("design:returntype", Promise)
], RoleMappingRuleController.prototype, "patch", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    (0, decorators_1.GlobalScope)('roleMappingRule:delete'),
    __param(2, (0, decorators_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], RoleMappingRuleController.prototype, "delete", null);
exports.RoleMappingRuleController = RoleMappingRuleController = __decorate([
    (0, decorators_1.RestController)('/role-mapping-rule'),
    __metadata("design:paramtypes", [role_mapping_rule_service_ee_1.RoleMappingRuleService, backend_common_1.LicenseState])
], RoleMappingRuleController);
//# sourceMappingURL=role-mapping-rule.controller.ee.js.map