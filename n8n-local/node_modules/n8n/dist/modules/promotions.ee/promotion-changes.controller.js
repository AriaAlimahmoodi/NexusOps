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
exports.PromotionChangesController = void 0;
const api_types_1 = require("@n8n/api-types");
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const promotion_change_service_1 = require("./promotion-change.service");
let PromotionChangesController = class PromotionChangesController {
    constructor(changeService) {
        this.changeService = changeService;
    }
    async getChanges(req, _res, projectId, direction, query) {
        const parsed = api_types_1.promotionDirectionSchema.safeParse(direction);
        if (!parsed.success)
            throw new errors_1.NotFoundError(`Unknown promotion direction: ${direction}`);
        return await this.changeService.getChanges(req.user, projectId, parsed.data, query);
    }
};
exports.PromotionChangesController = PromotionChangesController;
__decorate([
    (0, decorators_1.Get)('/:projectId/changes/:direction'),
    (0, decorators_1.GlobalScope)('gitConnection:read'),
    (0, decorators_1.Licensed)(constants_1.LICENSE_FEATURES.GIT_CONNECTIONS),
    __param(2, (0, decorators_1.Param)('projectId')),
    __param(3, (0, decorators_1.Param)('direction')),
    __param(4, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, api_types_1.PromotionChangesQueryDto]),
    __metadata("design:returntype", Promise)
], PromotionChangesController.prototype, "getChanges", null);
exports.PromotionChangesController = PromotionChangesController = __decorate([
    (0, decorators_1.RestController)('/promotions'),
    __metadata("design:paramtypes", [promotion_change_service_1.PromotionChangeService])
], PromotionChangesController);
//# sourceMappingURL=promotion-changes.controller.js.map