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
exports.McpRegistryServerEntity = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let McpRegistryServerEntity = class McpRegistryServerEntity extends db_1.WithTimestamps {
};
exports.McpRegistryServerEntity = McpRegistryServerEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)('varchar'),
    __metadata("design:type", String)
], McpRegistryServerEntity.prototype, "slug", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], McpRegistryServerEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)('varchar'),
    __metadata("design:type", String)
], McpRegistryServerEntity.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)(db_1.datetimeColumnType),
    __metadata("design:type", Date)
], McpRegistryServerEntity.prototype, "registryUpdatedAt", void 0);
__decorate([
    (0, db_1.JsonColumn)(),
    __metadata("design:type", Object)
], McpRegistryServerEntity.prototype, "data", void 0);
exports.McpRegistryServerEntity = McpRegistryServerEntity = __decorate([
    (0, typeorm_1.Entity)('mcp_registry_server')
], McpRegistryServerEntity);
//# sourceMappingURL=mcp-registry-server.entity.js.map