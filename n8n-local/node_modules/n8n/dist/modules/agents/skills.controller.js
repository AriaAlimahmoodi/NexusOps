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
exports.SkillsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const skills_api_service_1 = require("./skills/skills-api.service");
const skills_hub_rollout_1 = require("./skills/skills-hub-rollout");
let SkillsController = class SkillsController {
    constructor(skillsApi, rollout) {
        this.skillsApi = skillsApi;
        this.rollout = rollout;
    }
    requireSkillsHub(_req, res, next) {
        if (!this.rollout.isEnabled) {
            res.status(404).send('Not found');
            return;
        }
        next();
    }
    async list(req, _res, query) {
        return await this.skillsApi.list(req.user, query);
    }
    async newName(req, _res, query) {
        return await this.skillsApi.newName(req.user, query);
    }
    async get(req, _res, skillId) {
        return await this.skillsApi.get(req.user, skillId);
    }
    async create(req, _res, payload) {
        return await this.skillsApi.create(req.user, payload);
    }
    async update(req, _res, skillId, payload) {
        return await this.skillsApi.update(req.user, skillId, payload);
    }
    async delete(req, _res, skillId) {
        await this.skillsApi.delete(req.user, skillId);
        return { ok: true };
    }
};
exports.SkillsController = SkillsController;
__decorate([
    (0, decorators_1.Middleware)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Function]),
    __metadata("design:returntype", void 0)
], SkillsController.prototype, "requireSkillsHub", null);
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListSkillsQueryDto]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "list", null);
__decorate([
    (0, decorators_1.Get)('/new-name'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.SkillNewNameQueryDto]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "newName", null);
__decorate([
    (0, decorators_1.Get)('/:skillId'),
    __param(2, (0, decorators_1.Param)('skillId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "get", null);
__decorate([
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateSkillDto]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Patch)('/:skillId'),
    __param(2, (0, decorators_1.Param)('skillId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.SaveSkillDto]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "update", null);
__decorate([
    (0, decorators_1.Delete)('/:skillId'),
    __param(2, (0, decorators_1.Param)('skillId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], SkillsController.prototype, "delete", null);
exports.SkillsController = SkillsController = __decorate([
    (0, decorators_1.RestController)('/skills'),
    __metadata("design:paramtypes", [skills_api_service_1.SkillsApiService, skills_hub_rollout_1.SkillsHubRollout])
], SkillsController);
//# sourceMappingURL=skills.controller.js.map