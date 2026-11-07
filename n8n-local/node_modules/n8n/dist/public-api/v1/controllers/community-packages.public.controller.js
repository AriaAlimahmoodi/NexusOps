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
exports.CommunityPackagesPublicController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const community_packages_lifecycle_service_1 = require("../../../modules/community-packages/community-packages.lifecycle.service");
const community_packages_mapper_1 = require("../../../public-api/v1/handlers/community-packages/community-packages.mapper");
let CommunityPackagesPublicController = class CommunityPackagesPublicController {
    constructor(communityPackagesLifecycleService) {
        this.communityPackagesLifecycleService = communityPackagesLifecycleService;
    }
    async getInstalledPackages(_req, _res, _query) {
        const packages = await this.communityPackagesLifecycleService.listInstalledPackages();
        return packages.map(community_packages_mapper_1.toCommunityPackagePublic);
    }
    async installPackage(req, _res, body) {
        const installedPackage = await this.communityPackagesLifecycleService.install({ name: body.name, version: body.version }, req.user, 'publicApi');
        return (0, community_packages_mapper_1.toCommunityPackagePublic)(installedPackage);
    }
    async updatePackage(req, _res, name, body) {
        const updated = await this.communityPackagesLifecycleService.update({ name, version: body.version }, req.user, 'notFound');
        return (0, community_packages_mapper_1.toCommunityPackagePublic)(updated);
    }
    async uninstallPackage(req, _res, packageName) {
        await this.communityPackagesLifecycleService.uninstall(packageName, req.user, 'notFound');
    }
};
exports.CommunityPackagesPublicController = CommunityPackagesPublicController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.ApiKeyScope)('communityPackage:list'),
    (0, decorators_1.ApiSummary)('List installed community packages'),
    (0, decorators_1.ApiDescription)('Retrieve all installed community packages with pending update info.'),
    (0, decorators_1.ApiTags)(['CommunityPackage']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CommunityPackageListPublicDto),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListCommunityPackagesQueryDto]),
    __metadata("design:returntype", Promise)
], CommunityPackagesPublicController.prototype, "getInstalledPackages", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.ApiKeyScope)('communityPackage:install'),
    (0, decorators_1.ApiSummary)('Install a community package'),
    (0, decorators_1.ApiDescription)('Install a community package by npm name and optional version.'),
    (0, decorators_1.ApiTags)(['CommunityPackage']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CommunityPackagePublicDto),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.InstallCommunityPackagePublicDto]),
    __metadata("design:returntype", Promise)
], CommunityPackagesPublicController.prototype, "installPackage", null);
__decorate([
    (0, decorators_1.Patch)('/:name'),
    (0, decorators_1.ApiKeyScope)('communityPackage:update'),
    (0, decorators_1.ApiSummary)('Update a community package'),
    (0, decorators_1.ApiDescription)('Update an installed community package to a new version.'),
    (0, decorators_1.ApiTags)(['CommunityPackage']),
    (0, decorators_1.ApiResponse)(200, api_types_1.CommunityPackagePublicDto),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('name', api_types_1.communityPackageNameParamSchema)),
    __param(3, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, api_types_1.UpdateCommunityPackagePublicDto]),
    __metadata("design:returntype", Promise)
], CommunityPackagesPublicController.prototype, "updatePackage", null);
__decorate([
    (0, decorators_1.Delete)('/:name'),
    (0, decorators_1.ApiKeyScope)('communityPackage:uninstall'),
    (0, decorators_1.ApiSummary)('Uninstall a community package'),
    (0, decorators_1.ApiDescription)('Uninstall a community package by name.'),
    (0, decorators_1.ApiTags)(['CommunityPackage']),
    (0, decorators_1.ApiResponse)(204),
    (0, decorators_1.ApiErrorResponse)(400),
    (0, decorators_1.ApiErrorResponse)(404),
    __param(2, (0, decorators_1.Param)('name', api_types_1.communityPackageNameParamSchema)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], CommunityPackagesPublicController.prototype, "uninstallPackage", null);
exports.CommunityPackagesPublicController = CommunityPackagesPublicController = __decorate([
    (0, decorators_1.PublicApiController)('/community-packages'),
    __metadata("design:paramtypes", [community_packages_lifecycle_service_1.CommunityPackagesLifecycleService])
], CommunityPackagesPublicController);
//# sourceMappingURL=community-packages.public.controller.js.map