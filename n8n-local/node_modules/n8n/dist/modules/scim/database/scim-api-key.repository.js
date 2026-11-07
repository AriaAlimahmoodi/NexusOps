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
exports.ScimApiKeyRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const backend_services_1 = require("@n8n/backend-services");
let ScimApiKeyRepository = class ScimApiKeyRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(db_1.ApiKey, dataSource.manager, transactionRunner);
        this.audience = backend_services_1.TOKEN_PURPOSES.scimApiKey;
        this.label = 'SCIM Provisioning API Key';
    }
    async findByUserId(userId, ctx) {
        return await this.managerFor(ctx).findOne(db_1.ApiKey, {
            where: { userId, audience: this.audience },
        });
    }
    async findByKey(apiKey, ctx) {
        return await this.managerFor(ctx).findOne(db_1.ApiKey, {
            where: { apiKey, audience: this.audience },
            relations: ['user'],
        });
    }
    async replaceForUser(userId, apiKey, ctx) {
        const { audience, label } = this;
        return await this.runInTransaction(ctx, async (tx) => {
            await tx.delete(db_1.ApiKey, { userId, audience });
            await tx.insert(db_1.ApiKey, this.create({ userId, apiKey, audience, scopes: [], label }));
            return await tx.findOneByOrFail(db_1.ApiKey, { apiKey });
        });
    }
    async deleteAllForUser(userId, ctx) {
        await this.managerFor(ctx).delete(db_1.ApiKey, { userId, audience: this.audience });
    }
};
exports.ScimApiKeyRepository = ScimApiKeyRepository;
exports.ScimApiKeyRepository = ScimApiKeyRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], ScimApiKeyRepository);
//# sourceMappingURL=scim-api-key.repository.js.map