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
exports.AiPreferenceController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const ai_preference_service_1 = require("../services/ai-preference.service");
let AiPreferenceController = class AiPreferenceController {
    constructor(aiPreferenceService) {
        this.aiPreferenceService = aiPreferenceService;
    }
    async getPreferences(req, _res, query) {
        return await this.aiPreferenceService.list(req.user, query);
    }
    async countPreferences(req) {
        return await this.aiPreferenceService.count(req.user);
    }
    async createPreference(req, _res, payload) {
        return await this.aiPreferenceService.create(req.user, payload, 'ui');
    }
    async updatePreference(req, _res, payload) {
        return await this.aiPreferenceService.update(req.user, req.params.id, payload);
    }
    async deletePreference(req) {
        await this.aiPreferenceService.delete(req.user, req.params.id);
        return true;
    }
};
exports.AiPreferenceController = AiPreferenceController;
__decorate([
    (0, decorators_1.Get)('/'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiPreferenceListQueryDto]),
    __metadata("design:returntype", Promise)
], AiPreferenceController.prototype, "getPreferences", null);
__decorate([
    (0, decorators_1.Get)('/count'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiPreferenceController.prototype, "countPreferences", null);
__decorate([
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiPreferenceRequestDto]),
    __metadata("design:returntype", Promise)
], AiPreferenceController.prototype, "createPreference", null);
__decorate([
    (0, decorators_1.Patch)('/:id'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.AiPreferenceRequestDto]),
    __metadata("design:returntype", Promise)
], AiPreferenceController.prototype, "updatePreference", null);
__decorate([
    (0, decorators_1.Delete)('/:id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiPreferenceController.prototype, "deletePreference", null);
exports.AiPreferenceController = AiPreferenceController = __decorate([
    (0, decorators_1.RestController)('/ai-preferences'),
    __metadata("design:paramtypes", [ai_preference_service_1.AiPreferenceService])
], AiPreferenceController);
//# sourceMappingURL=ai-preference.controller.js.map