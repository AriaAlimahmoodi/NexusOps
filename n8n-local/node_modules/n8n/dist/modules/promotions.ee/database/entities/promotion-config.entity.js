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
exports.PromotionConfig = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
const promotion_connection_entity_1 = require("./promotion-connection.entity");
let PromotionConfig = class PromotionConfig extends db_1.WithTimestampsAndStringId {
};
exports.PromotionConfig = PromotionConfig;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 36 }),
    __metadata("design:type", String)
], PromotionConfig.prototype, "connectionId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], PromotionConfig.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], PromotionConfig.prototype, "direction", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], PromotionConfig.prototype, "settings", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => promotion_connection_entity_1.PromotionConnection, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'connectionId' }),
    __metadata("design:type", Object)
], PromotionConfig.prototype, "connection", void 0);
exports.PromotionConfig = PromotionConfig = __decorate([
    (0, typeorm_1.Entity)('promotion_config'),
    (0, typeorm_1.Index)(['connectionId', 'direction'], { unique: true })
], PromotionConfig);
//# sourceMappingURL=promotion-config.entity.js.map