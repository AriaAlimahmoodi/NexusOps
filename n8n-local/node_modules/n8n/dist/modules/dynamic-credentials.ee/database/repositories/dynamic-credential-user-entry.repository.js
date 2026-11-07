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
exports.DynamicCredentialUserEntryRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const dynamic_credential_user_entry_1 = require("../entities/dynamic-credential-user-entry");
let DynamicCredentialUserEntryRepository = class DynamicCredentialUserEntryRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(dynamic_credential_user_entry_1.DynamicCredentialUserEntry, dataSource.manager);
    }
    async deleteByPairs(pairs, em) {
        if (pairs.length === 0)
            return;
        const whereClauses = pairs.map((_, i) => `(credentialId = :cid${i} AND userId = :uid${i})`);
        const params = Object.fromEntries(pairs.flatMap(({ credentialId, userId }, i) => [
            [`cid${i}`, credentialId],
            [`uid${i}`, userId],
        ]));
        await em
            .createQueryBuilder()
            .delete()
            .from(dynamic_credential_user_entry_1.DynamicCredentialUserEntry)
            .where(whereClauses.join(' OR '), params)
            .execute();
    }
};
exports.DynamicCredentialUserEntryRepository = DynamicCredentialUserEntryRepository;
exports.DynamicCredentialUserEntryRepository = DynamicCredentialUserEntryRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], DynamicCredentialUserEntryRepository);
//# sourceMappingURL=dynamic-credential-user-entry.repository.js.map