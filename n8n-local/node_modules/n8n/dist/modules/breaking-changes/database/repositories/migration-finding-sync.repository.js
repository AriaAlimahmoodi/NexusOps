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
exports.MigrationFindingSyncRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const migration_finding_sync_entity_1 = require("../entities/migration-finding-sync.entity");
let MigrationFindingSyncRepository = class MigrationFindingSyncRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(migration_finding_sync_entity_1.MigrationFindingSync, dataSource.manager, transactionRunner);
    }
    async getForVersion(targetVersion, ctx) {
        return await this.managerFor(ctx).findOneBy(migration_finding_sync_entity_1.MigrationFindingSync, { targetVersion });
    }
    async upsertForVersion(record, ctx) {
        await this.managerFor(ctx).upsert(migration_finding_sync_entity_1.MigrationFindingSync, record, ['targetVersion']);
    }
    async deleteForVersion(targetVersion, ctx) {
        await this.managerFor(ctx).delete(migration_finding_sync_entity_1.MigrationFindingSync, { targetVersion });
    }
};
exports.MigrationFindingSyncRepository = MigrationFindingSyncRepository;
exports.MigrationFindingSyncRepository = MigrationFindingSyncRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], MigrationFindingSyncRepository);
//# sourceMappingURL=migration-finding-sync.repository.js.map