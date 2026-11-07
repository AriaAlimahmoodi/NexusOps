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
exports.TestWebhooksController = void 0;
const decorators_1 = require("@n8n/decorators");
const test_webhooks_1 = require("../webhooks/test-webhooks");
let TestWebhooksController = class TestWebhooksController {
    constructor(testWebhooks) {
        this.testWebhooks = testWebhooks;
    }
    async cancel(_req, _res, workflowId) {
        await this.testWebhooks.cancelWebhook(workflowId);
    }
};
exports.TestWebhooksController = TestWebhooksController;
__decorate([
    (0, decorators_1.Delete)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    __param(2, (0, decorators_1.Param)('workflowId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], TestWebhooksController.prototype, "cancel", null);
exports.TestWebhooksController = TestWebhooksController = __decorate([
    (0, decorators_1.RestController)('/test-webhook'),
    __metadata("design:paramtypes", [test_webhooks_1.TestWebhooks])
], TestWebhooksController);
//# sourceMappingURL=test-webhooks.controller.js.map