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
exports.FavoritesController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const add_favorite_dto_1 = require("./dto/add-favorite.dto");
const favorites_service_1 = require("./favorites.service");
function isFavoriteResourceType(value) {
    return api_types_1.FAVORITE_RESOURCE_TYPES.includes(value);
}
let FavoritesController = class FavoritesController {
    constructor(favoritesService) {
        this.favoritesService = favoritesService;
    }
    async getFavorites(req) {
        return await this.favoritesService.getEnrichedFavorites(req.user);
    }
    async addFavorite(req, _res, body) {
        return await this.favoritesService.addFavorite(req.user.id, body.resourceId, body.resourceType);
    }
    async removeFavorite(req, _res, resourceId, resourceType) {
        if (!isFavoriteResourceType(resourceType)) {
            throw new errors_1.BadRequestError(`Invalid resourceType: ${resourceType}`);
        }
        await this.favoritesService.removeFavorite(req.user.id, resourceId, resourceType);
        return true;
    }
};
exports.FavoritesController = FavoritesController;
__decorate([
    (0, decorators_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "getFavorites", null);
__decorate([
    (0, decorators_1.Post)('/'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, add_favorite_dto_1.AddFavoriteDto]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "addFavorite", null);
__decorate([
    (0, decorators_1.Delete)('/:resourceType/:resourceId'),
    __param(2, (0, decorators_1.Param)('resourceId')),
    __param(3, (0, decorators_1.Param)('resourceType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], FavoritesController.prototype, "removeFavorite", null);
exports.FavoritesController = FavoritesController = __decorate([
    (0, decorators_1.RestController)('/favorites'),
    __metadata("design:paramtypes", [favorites_service_1.FavoritesService])
], FavoritesController);
//# sourceMappingURL=favorites.controller.js.map