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
exports.UserFavoriteRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const user_favorite_entity_1 = require("../entities/user-favorite.entity");
let UserFavoriteRepository = class UserFavoriteRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(user_favorite_entity_1.UserFavorite, dataSource.manager);
    }
    async findByUser(userId) {
        return await this.find({
            where: { userId },
            order: { id: 'DESC' },
        });
    }
    async deleteByResourceId(resourceId, resourceType) {
        await this.delete({ resourceId, resourceType });
    }
    async deleteByResourceIds(resourceIds, resourceType) {
        if (resourceIds.length === 0)
            return;
        await this.delete({ resourceId: (0, typeorm_1.In)(resourceIds), resourceType });
    }
};
exports.UserFavoriteRepository = UserFavoriteRepository;
exports.UserFavoriteRepository = UserFavoriteRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], UserFavoriteRepository);
//# sourceMappingURL=user-favorite.repository.js.map