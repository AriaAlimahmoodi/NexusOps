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
exports.TrustedSourceRepository = void 0;
const config_1 = require("@n8n/config");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const trusted_source_entity_1 = require("../entities/trusted-source.entity");
class TrustedSourceTable extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(trusted_source_entity_1.TrustedSourceEntity, dataSource.manager, transactionRunner);
    }
    managerFor(ctx) {
        return super.managerFor(ctx);
    }
}
let TrustedSourceRepository = class TrustedSourceRepository {
    constructor(dataSource, transactionRunner, config) {
        this.table = new TrustedSourceTable(dataSource, transactionRunner);
        this.isPostgres = config.type === 'postgresdb';
    }
    async findById(id, ctx = {}) {
        return await this.table.managerFor(ctx).findOneBy(trusted_source_entity_1.TrustedSourceEntity, { id });
    }
    async findByIssuer(issuer, ctx = {}) {
        return await this.table.managerFor(ctx).findOneBy(trusted_source_entity_1.TrustedSourceEntity, { issuer });
    }
    async findAll(ctx = {}) {
        return await this.table.managerFor(ctx).find(trusted_source_entity_1.TrustedSourceEntity, { order: { name: 'ASC' } });
    }
    async findDue({ errorRetrySeconds, healthyRefreshSeconds, limit }, ctx = {}) {
        const errorCutoff = (0, db_1.dbNowPlusMsLiteral)(this.isPostgres, -errorRetrySeconds * 1000);
        const healthyCutoff = (0, db_1.dbNowPlusMsLiteral)(this.isPostgres, -healthyRefreshSeconds * 1000);
        return await this.table
            .managerFor(ctx)
            .createQueryBuilder(trusted_source_entity_1.TrustedSourceEntity, 'source')
            .where(`source.status = :unchecked OR source.lastCheckedAt IS NULL
					OR (source.status = :error AND source.lastCheckedAt < ${errorCutoff})
					OR (source.status = :healthy AND source.lastCheckedAt < ${healthyCutoff})`, { unchecked: 'unchecked', error: 'error', healthy: 'healthy' })
            .orderBy("CASE WHEN source.status = 'unchecked' THEN 0 ELSE 1 END", 'ASC')
            .addOrderBy('CASE WHEN source.lastCheckedAt IS NULL THEN 0 ELSE 1 END', 'ASC')
            .addOrderBy('source.lastCheckedAt', 'ASC')
            .take(limit)
            .getMany();
    }
    async insertRow(row, ctx = {}) {
        return await this.table.managerFor(ctx).save(trusted_source_entity_1.TrustedSourceEntity, this.table.create(row));
    }
    async insertIfAbsent(row, ctx = {}) {
        await this.table
            .managerFor(ctx)
            .createQueryBuilder()
            .insert()
            .into(trusted_source_entity_1.TrustedSourceEntity)
            .values(row)
            .orIgnore()
            .execute();
    }
    async updateById(id, changes, ctx = {}) {
        await this.table.managerFor(ctx).update(trusted_source_entity_1.TrustedSourceEntity, { id }, changes);
    }
    async deleteById(id, ctx = {}) {
        await this.table.managerFor(ctx).delete(trusted_source_entity_1.TrustedSourceEntity, { id });
    }
    async claimForDiscovery(id, token, leaseSeconds, ctx = {}) {
        const staleBefore = (0, db_1.dbNowPlusMsLiteral)(this.isPostgres, -leaseSeconds * 1000);
        const result = await this.table
            .managerFor(ctx)
            .createQueryBuilder()
            .update(trusted_source_entity_1.TrustedSourceEntity)
            .set({
            discoveryClaimToken: token,
            discoveryClaimedAt: () => (0, db_1.dbNowLiteral)(this.isPostgres),
        })
            .where(`id = :id AND ("discoveryClaimedAt" IS NULL OR "discoveryClaimedAt" < ${staleBefore})`, { id })
            .execute();
        return result.affected === 1;
    }
    async recordDiscovery(id, token, changes, ctx = {}) {
        const result = await this.table
            .managerFor(ctx)
            .createQueryBuilder()
            .update(trusted_source_entity_1.TrustedSourceEntity)
            .set({
            ...changes,
            lastCheckedAt: () => (0, db_1.dbNowLiteral)(this.isPostgres),
            discoveryClaimToken: null,
            discoveryClaimedAt: null,
        })
            .where('id = :id AND "discoveryClaimToken" = :token', { id, token })
            .execute();
        return result.affected === 1;
    }
};
exports.TrustedSourceRepository = TrustedSourceRepository;
exports.TrustedSourceRepository = TrustedSourceRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner, config_1.DatabaseConfig])
], TrustedSourceRepository);
//# sourceMappingURL=trusted-source.repository.js.map