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
exports.AccessTokenRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const oauth_access_token_entity_1 = require("../entities/oauth-access-token.entity");
let AccessTokenRepository = class AccessTokenRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(oauth_access_token_entity_1.AccessToken, dataSource.manager, transactionRunner);
    }
    async insertToken(token, ctx) {
        await this.managerFor(ctx).insert(oauth_access_token_entity_1.AccessToken, token);
    }
    async isActive(token) {
        return await this.existsBy({ token });
    }
};
exports.AccessTokenRepository = AccessTokenRepository;
exports.AccessTokenRepository = AccessTokenRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AccessTokenRepository);
//# sourceMappingURL=oauth-access-token.repository.js.map