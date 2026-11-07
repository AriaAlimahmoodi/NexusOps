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
exports.AuditPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const security_audit_service_1 = require("../../../security-audit/security-audit.service");
let AuditPublicController = class AuditPublicController {
    constructor(securityAuditService) {
        this.securityAuditService = securityAuditService;
    }
    async generateAudit(_req, _res, body) {
        return await this.securityAuditService.run(body.additionalOptions?.categories, body.additionalOptions?.daysAbandonedWorkflow);
    }
};
exports.AuditPublicController = AuditPublicController;
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('securityAudit:generate'),
    (0, decorators_1.ApiSummary)('Generate an audit'),
    (0, decorators_1.ApiDescription)('Generate a security audit for your n8n instance.'),
    (0, decorators_1.ApiTags)(['Audit']),
    (0, decorators_1.ApiResponse)(200, api_types_1.AuditPublicDto),
    (0, decorators_1.ApiErrorResponse)(500),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.GenerateAuditPublicDto]),
    __metadata("design:returntype", Promise)
], AuditPublicController.prototype, "generateAudit", null);
exports.AuditPublicController = AuditPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/audit'),
    __metadata("design:paramtypes", [security_audit_service_1.SecurityAuditService])
], AuditPublicController);
//# sourceMappingURL=audit.public.controller.js.map