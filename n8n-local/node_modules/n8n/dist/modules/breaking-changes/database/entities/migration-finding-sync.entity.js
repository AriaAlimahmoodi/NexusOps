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
exports.MigrationFindingSync = void 0;
const db_1 = require("@n8n/db");
const typeorm_1 = require("@n8n/typeorm");
let MigrationFindingSync = class MigrationFindingSync extends typeorm_1.BaseEntity {
};
exports.MigrationFindingSync = MigrationFindingSync;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 16 }),
    __metadata("design:type", String)
], MigrationFindingSync.prototype, "targetVersion", void 0);
__decorate([
    (0, db_1.DateTimeColumn)(),
    __metadata("design:type", Date)
], MigrationFindingSync.prototype, "syncedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 128 }),
    __metadata("design:type", String)
], MigrationFindingSync.prototype, "ruleSetFingerprint", void 0);
exports.MigrationFindingSync = MigrationFindingSync = __decorate([
    (0, typeorm_1.Entity)({ name: 'migration_finding_sync' })
], MigrationFindingSync);
//# sourceMappingURL=migration-finding-sync.entity.js.map