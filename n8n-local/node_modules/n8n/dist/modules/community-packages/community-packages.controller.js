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
exports.CommunityPackagesController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const community_packages_lifecycle_service_1 = require("./community-packages.lifecycle.service");
let CommunityPackagesController = class CommunityPackagesController {
    constructor(communityPackagesLifecycle) {
        this.communityPackagesLifecycle = communityPackagesLifecycle;
    }
    async installPackage(req, _res, body) {
        return await this.communityPackagesLifecycle.install(body, req.user, 'ui');
    }
    async getInstalledPackages() {
        return await this.communityPackagesLifecycle.listInstalledPackages();
    }
    async uninstallPackage(req) {
        const { name } = req.query;
        await this.communityPackagesLifecycle.uninstall(name, req.user, 'badRequest');
    }
    async updatePackage(req, _res, body) {
        return await this.communityPackagesLifecycle.update(body, req.user, 'badRequest');
    }
};
exports.CommunityPackagesController = CommunityPackagesController;
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('communityPackage:install'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CommunityPackageRequestDto]),
    __metadata("design:returntype", Promise)
], CommunityPackagesController.prototype, "installPackage", null);
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('communityPackage:list'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CommunityPackagesController.prototype, "getInstalledPackages", null);
__decorate([
    (0, decorators_1.Delete)('/'),
    (0, decorators_1.GlobalScope)('communityPackage:uninstall'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CommunityPackagesController.prototype, "uninstallPackage", null);
__decorate([
    (0, decorators_1.Patch)('/'),
    (0, decorators_1.GlobalScope)('communityPackage:update'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CommunityPackageRequestDto]),
    __metadata("design:returntype", Promise)
], CommunityPackagesController.prototype, "updatePackage", null);
exports.CommunityPackagesController = CommunityPackagesController = __decorate([
    (0, decorators_1.RestController)('/community-packages'),
    __metadata("design:paramtypes", [community_packages_lifecycle_service_1.CommunityPackagesLifecycleService])
], CommunityPackagesController);
//# sourceMappingURL=community-packages.controller.js.map