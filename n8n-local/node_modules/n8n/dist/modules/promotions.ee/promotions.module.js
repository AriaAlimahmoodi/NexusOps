"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromotionsModule = void 0;
const constants_1 = require("@n8n/constants");
const decorators_1 = require("@n8n/decorators");
const di_1 = require("@n8n/di");
let PromotionsModule = class PromotionsModule {
    async init() {
        await import('./promotion-changes.controller.js');
        const { PromotionsService } = await import('./promotions.service.js');
        di_1.Container.get(PromotionsService);
    }
    async entities() {
        const { PromotionProvider } = await import('./database/entities/promotion-provider.entity.js');
        const { PromotionConnection } = await import('./database/entities/promotion-connection.entity.js');
        const { PromotionConnectionProject } = await import('./database/entities/promotion-connection-project.entity.js');
        const { PromotionConfig } = await import('./database/entities/promotion-config.entity.js');
        const { PromotionRun } = await import('./database/entities/promotion-run.entity.js');
        const { PromotionReview } = await import('./database/entities/promotion-review.entity.js');
        return [
            PromotionProvider,
            PromotionConnection,
            PromotionConnectionProject,
            PromotionConfig,
            PromotionRun,
            PromotionReview,
        ];
    }
};
exports.PromotionsModule = PromotionsModule;
exports.PromotionsModule = PromotionsModule = __decorate([
    (0, decorators_1.BackendModule)({
        name: 'promotions',
        licenseFlag: constants_1.LICENSE_FEATURES.GIT_CONNECTIONS,
        instanceTypes: ['main'],
    })
], PromotionsModule);
//# sourceMappingURL=promotions.module.js.map