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
exports.CredentialOptionsController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const credential_options_service_1 = require("./credential-options.service");
let CredentialOptionsController = class CredentialOptionsController {
    constructor(credentialOptionsService) {
        this.credentialOptionsService = credentialOptionsService;
    }
    async lookupProjectDraft(req, _res, projectId, request) {
        return await this.credentialOptionsService.lookupDraft(req.user, request, projectId);
    }
    async lookupInstanceDraft(req, _res, request) {
        return await this.credentialOptionsService.lookupDraft(req.user, request, null);
    }
    async lookupStored(req, _res, credentialId, request) {
        return await this.credentialOptionsService.lookupStored(req.user, credentialId, request);
    }
};
exports.CredentialOptionsController = CredentialOptionsController;
__decorate([
    (0, decorators_1.Post)('/options/projects/:projectId'),
    (0, decorators_1.ProjectScope)('credential:create'),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CredentialOptionsRequestDto]),
    __metadata("design:returntype", Promise)
], CredentialOptionsController.prototype, "lookupProjectDraft", null);
__decorate([
    (0, decorators_1.Post)('/options/instance'),
    (0, decorators_1.GlobalScope)('credential:manageInstance'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CredentialOptionsRequestDto]),
    __metadata("design:returntype", Promise)
], CredentialOptionsController.prototype, "lookupInstanceDraft", null);
__decorate([
    (0, decorators_1.Post)('/:credentialId/options'),
    (0, decorators_1.ProjectScope)('credential:read'),
    __param(2, (0, decorators_1.Param)('credentialId')),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.CredentialOptionsRequestDto]),
    __metadata("design:returntype", Promise)
], CredentialOptionsController.prototype, "lookupStored", null);
exports.CredentialOptionsController = CredentialOptionsController = __decorate([
    (0, decorators_1.RestController)('/credentials'),
    __metadata("design:paramtypes", [credential_options_service_1.CredentialOptionsService])
], CredentialOptionsController);
//# sourceMappingURL=credential-options.controller.js.map