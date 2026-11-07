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
exports.SelfHealingResultsController = void 0;
const decorators_1 = require("@n8n/decorators");
const self_healing_result_service_1 = require("./self-healing-result.service");
let SelfHealingResultsController = class SelfHealingResultsController {
    constructor(results) {
        this.results = results;
    }
    async getDetail(req) {
        const { projectId, workflowId, resultId } = req.params;
        return await this.results.getDetail(req.user, projectId, workflowId, resultId);
    }
    async approveAndPublish(req) {
        const { projectId, workflowId, resultId } = req.params;
        return await this.results.act(req.user, projectId, workflowId, resultId, 'approve-and-publish', req.headers['push-ref']);
    }
    async apply(req) {
        const { projectId, workflowId, resultId } = req.params;
        return await this.results.act(req.user, projectId, workflowId, resultId, 'apply', req.headers['push-ref']);
    }
    async dismiss(req) {
        const { projectId, workflowId, resultId } = req.params;
        return await this.results.dismiss(req.user, projectId, workflowId, resultId);
    }
};
exports.SelfHealingResultsController = SelfHealingResultsController;
__decorate([
    (0, decorators_1.Get)('/:resultId'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SelfHealingResultsController.prototype, "getDetail", null);
__decorate([
    (0, decorators_1.Post)('/:resultId/approve-and-publish'),
    (0, decorators_1.ProjectScope)('workflow:publish'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SelfHealingResultsController.prototype, "approveAndPublish", null);
__decorate([
    (0, decorators_1.Post)('/:resultId/apply'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SelfHealingResultsController.prototype, "apply", null);
__decorate([
    (0, decorators_1.Post)('/:resultId/dismiss'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SelfHealingResultsController.prototype, "dismiss", null);
exports.SelfHealingResultsController = SelfHealingResultsController = __decorate([
    (0, decorators_1.RestController)('/projects/:projectId/workflows/:workflowId/self-healing-results'),
    __metadata("design:paramtypes", [self_healing_result_service_1.SelfHealingResultService])
], SelfHealingResultsController);
//# sourceMappingURL=self-healing-results.controller.js.map