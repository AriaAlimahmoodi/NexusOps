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
exports.OAuthGrantRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const oauth_access_token_entity_1 = require("../entities/oauth-access-token.entity");
const oauth_authorization_code_entity_1 = require("../entities/oauth-authorization-code.entity");
const oauth_refresh_token_entity_1 = require("../entities/oauth-refresh-token.entity");
const oauth_user_consent_entity_1 = require("../entities/oauth-user-consent.entity");
let OAuthGrantRepository = class OAuthGrantRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(db_1.User, dataSource.manager, transactionRunner);
    }
    async deleteGrantsForDisabledUsers() {
        const batchSize = 100;
        let afterId;
        while (true) {
            const ids = await this.runInTransaction({}, async (manager) => {
                const users = await manager.find(db_1.User, {
                    where: { disabled: true, ...(afterId ? { id: (0, typeorm_1.MoreThan)(afterId) } : {}) },
                    select: ['id'],
                    order: { id: 'ASC' },
                    take: batchSize,
                    ...(manager.connection.options.type === 'postgres'
                        ? { lock: { mode: 'pessimistic_write' } }
                        : {}),
                });
                const userIds = users.map(({ id }) => id);
                if (userIds.length > 0) {
                    for (const entity of [oauth_access_token_entity_1.AccessToken, oauth_refresh_token_entity_1.RefreshToken, oauth_authorization_code_entity_1.AuthorizationCode, oauth_user_consent_entity_1.UserConsent]) {
                        await manager.delete(entity, { userId: (0, typeorm_1.In)(userIds) });
                    }
                }
                return userIds;
            });
            if (ids.length < batchSize)
                return;
            afterId = ids.at(-1);
        }
    }
    async lockUserForGrant(userId, ctx) {
        return await this.findLockedUser(this.managerFor(ctx), userId);
    }
    async findLockedUser(manager, userId) {
        return await manager.findOne(db_1.User, {
            where: { id: userId },
            ...(manager.connection.options.type === 'postgres'
                ? { lock: { mode: 'pessimistic_write' } }
                : {}),
        });
    }
    async deleteUserGrants(userId, ctx) {
        const manager = this.managerFor(ctx);
        await manager.delete(oauth_access_token_entity_1.AccessToken, { userId });
        await manager.delete(oauth_refresh_token_entity_1.RefreshToken, { userId });
        await manager.delete(oauth_authorization_code_entity_1.AuthorizationCode, { userId });
        await manager.delete(oauth_user_consent_entity_1.UserConsent, { userId });
    }
};
exports.OAuthGrantRepository = OAuthGrantRepository;
exports.OAuthGrantRepository = OAuthGrantRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], OAuthGrantRepository);
//# sourceMappingURL=oauth-grant.repository.js.map