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
exports.EncryptionKeyController = void 0;
const api_types_1 = require("@n8n/api-types");
const decorators_1 = require("@n8n/decorators");
const errors_1 = require("@n8n/errors");
const key_manager_service_1 = require("../../encryption/key-manager.service");
function toResponseDto(row) {
    return {
        id: row.id,
        type: row.type,
        algorithm: row.algorithm,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}
let EncryptionKeyController = class EncryptionKeyController {
    constructor(keyManagerService) {
        this.keyManagerService = keyManagerService;
    }
    async list(_req, _res, query) {
        if (query.activatedFrom &&
            query.activatedTo &&
            new Date(query.activatedFrom).getTime() > new Date(query.activatedTo).getTime()) {
            throw new errors_1.BadRequestError('activatedFrom must be earlier than or equal to activatedTo');
        }
        const { items, count } = await this.keyManagerService.listKeys(query);
        return { count, items: items.map(toResponseDto) };
    }
    async create(_req, _res, _body) {
        const row = await this.keyManagerService.rotateKey();
        return toResponseDto(row);
    }
};
exports.EncryptionKeyController = EncryptionKeyController;
__decorate([
    (0, decorators_1.Get)('/'),
    (0, decorators_1.GlobalScope)('encryptionKey:manage'),
    __param(2, decorators_1.Query),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.ListEncryptionKeysQueryDto]),
    __metadata("design:returntype", Promise)
], EncryptionKeyController.prototype, "list", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('encryptionKey:manage'),
    __param(2, decorators_1.Body),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, api_types_1.CreateEncryptionKeyDto]),
    __metadata("design:returntype", Promise)
], EncryptionKeyController.prototype, "create", null);
exports.EncryptionKeyController = EncryptionKeyController = __decorate([
    (0, decorators_1.RestController)('/encryption/keys'),
    __metadata("design:paramtypes", [key_manager_service_1.KeyManagerService])
], EncryptionKeyController);
//# sourceMappingURL=encryption-key.controller.js.map