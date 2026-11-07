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
exports.ProjectPoolSettingsController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const pool_config_service_ee_1 = require("../scaling/pool-config.service.ee");
let ProjectPoolSettingsController = class ProjectPoolSettingsController {
    constructor(poolConfigService) {
        this.poolConfigService = poolConfigService;
    }
    async getPoolSettings(_req, _res, projectId) {
        return await this.poolConfigService.getProjectPoolSettings(projectId);
    }
    async updatePoolSettings(_req, _res, dto, projectId) {
        return await this.poolConfigService.setProjectPoolSettings(projectId, dto);
    }
};
exports.ProjectPoolSettingsController = ProjectPoolSettingsController;
__decorate([
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.WORKER_POOLS),
    (0, decorators_1.ProjectScope)('project:read'),
    (0, decorators_1.Get)('/'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ProjectPoolSettingsController.prototype, "getPoolSettings", null);
__decorate([
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.WORKER_POOLS),
    (0, decorators_1.ProjectScope)('project:update'),
    (0, decorators_1.Patch)('/'),
    __param(2, decorators_1.Body),
    __param(3, (0, decorators_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.UpdateProjectPoolSettingsDto, String]),
    __metadata("design:returntype", Promise)
], ProjectPoolSettingsController.prototype, "updatePoolSettings", null);
exports.ProjectPoolSettingsController = ProjectPoolSettingsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/pool-settings'),
    __metadata("design:paramtypes", [pool_config_service_ee_1.PoolConfigService])
], ProjectPoolSettingsController);
//# sourceMappingURL=project-pool-settings.controller.ee.js.map