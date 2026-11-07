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
exports.TrustedKeySourceRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const trusted_key_source_entity_1 = require("../entities/trusted-key-source.entity");
const trusted_key_entity_1 = require("../entities/trusted-key.entity");
let TrustedKeySourceRepository = class TrustedKeySourceRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(trusted_key_source_entity_1.TrustedKeySourceEntity, dataSource.manager, transactionRunner);
    }
    async refreshSource(sourceId, resolveKeys, ctx) {
        if (!ctx.trx) {
            throw new n8n_workflow_1.UnexpectedError('Trusted key refresh requires a transaction');
        }
        const tx = this.managerFor(ctx);
        const source = await tx.findOneBy(trusted_key_source_entity_1.TrustedKeySourceEntity, { id: sourceId });
        if (!source) {
            return;
        }
        const result = await resolveKeys(source);
        await this.storeResolvedKeys(source, result, tx);
    }
    async storeResolvedKeys(source, result, tx) {
        if (!result) {
            await tx.update(trusted_key_source_entity_1.TrustedKeySourceEntity, source.id, {
                status: 'healthy',
                lastRefreshedAt: new Date(),
            });
            return;
        }
        await tx.delete(trusted_key_entity_1.TrustedKeyEntity, { sourceId: source.id });
        for (const key of result.keys) {
            await tx.save(trusted_key_entity_1.TrustedKeyEntity, {
                sourceId: source.id,
                kid: key.kid,
                data: JSON.stringify(key.data),
                createdAt: new Date(),
            });
        }
        const updatePayload = {
            status: 'healthy',
            lastError: null,
            lastRefreshedAt: new Date(),
        };
        if (result.cacheTtlSeconds !== undefined) {
            const config = (0, n8n_workflow_1.jsonParse)(source.config);
            config.cacheTtlSeconds = result.cacheTtlSeconds;
            updatePayload.config = JSON.stringify(config);
        }
        await tx.update(trusted_key_source_entity_1.TrustedKeySourceEntity, source.id, updatePayload);
    }
};
exports.TrustedKeySourceRepository = TrustedKeySourceRepository;
exports.TrustedKeySourceRepository = TrustedKeySourceRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], TrustedKeySourceRepository);
//# sourceMappingURL=trusted-key-source.repository.js.map