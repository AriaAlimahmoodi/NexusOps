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
exports.OAuthGrantService = void 0;
const errors_js_1 = require("@modelcontextprotocol/sdk/server/auth/errors.js");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const oauth_grant_repository_1 = require("./database/repositories/oauth-grant.repository");
let OAuthGrantService = class OAuthGrantService {
    constructor(txRunner, grantRepository) {
        this.txRunner = txRunner;
        this.grantRepository = grantRepository;
    }
    async runForActiveUser(userId, work, ctx = {}) {
        return await this.txRunner.run(ctx, async (ctx) => {
            const user = await this.grantRepository.lockUserForGrant(userId, ctx);
            if (!user || user.disabled)
                throw new errors_js_1.InvalidGrantError('Invalid authorization grant');
            return await work(ctx);
        });
    }
};
exports.OAuthGrantService = OAuthGrantService;
exports.OAuthGrantService = OAuthGrantService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.TransactionRunner, oauth_grant_repository_1.OAuthGrantRepository])
], OAuthGrantService);
//# sourceMappingURL=oauth-grant.service.js.map