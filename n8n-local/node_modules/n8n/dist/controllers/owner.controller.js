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
exports.OwnerController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const auth_service_1 = require("../auth/auth.service");
const posthog_1 = require("../posthog");
const banner_service_1 = require("../services/banner.service");
const ownership_service_1 = require("../services/ownership.service");
const user_service_1 = require("../services/user.service");
let OwnerController = class OwnerController {
    constructor(authService, bannerService, userService, postHog, ownershipService) {
        this.authService = authService;
        this.bannerService = bannerService;
        this.userService = userService;
        this.postHog = postHog;
        this.ownershipService = ownershipService;
    }
    async setupOwner(req, res, payload) {
        const owner = await this.ownershipService.setupOwner(payload);
        this.authService.issueCookie(res, owner, req.authInfo?.usedMfa ?? false, req.browserId);
        return await this.userService.toPublic(owner, { posthog: this.postHog, withScopes: true });
    }
    async dismissBanner(_req, _res, payload) {
        const bannerName = payload.banner;
        if (!bannerName)
            return;
        await this.bannerService.dismissBanner(bannerName);
    }
};
exports.OwnerController = OwnerController;
__decorate([
    (0, decorators_1.Post)('/setup', { skipAuth: true }),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.OwnerSetupRequestDto]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "setupOwner", null);
__decorate([
    (0, decorators_1.Post)('/dismiss-banner'),
    (0, decorators_1.GlobalScope)('banner:dismiss'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.DismissBannerRequestDto]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "dismissBanner", null);
exports.OwnerController = OwnerController = __decorate([
    (0, decorators_1.RestController)('/owner'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, banner_service_1.BannerService, user_service_1.UserService, posthog_1.PostHogClient, ownership_service_1.OwnershipService])
], OwnerController);
//# sourceMappingURL=owner.controller.js.map