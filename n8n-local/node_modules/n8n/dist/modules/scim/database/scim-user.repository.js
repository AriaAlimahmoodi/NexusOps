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
exports.ScimUserRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
let ScimUserRepository = class ScimUserRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner, userRepository) {
        super(db_1.User, dataSource.manager, transactionRunner);
        this.userRepository = userRepository;
    }
    async findPage({ skip, take, filter }, ctx) {
        const qb = this.managerFor(ctx)
            .createQueryBuilder(db_1.User, 'user')
            .leftJoinAndSelect('user.authIdentities', 'authIdentity')
            .leftJoinAndSelect('user.role', 'role')
            .orderBy('user.createdAt', 'ASC')
            .addOrderBy('user.id', 'ASC');
        if (filter?.attribute === 'userName') {
            qb.where('LOWER(user.email) = LOWER(:email)', { email: filter.value });
        }
        else if (filter?.attribute === 'externalId') {
            qb.where('authIdentity.providerId = :externalId AND authIdentity.providerType IN (:...providerTypes)', { externalId: filter.value, providerTypes: filter.providerTypes });
        }
        const total = await qb.getCount();
        const users = await qb.skip(skip).take(take).getMany();
        return [users, total];
    }
    async createProvisioned(user, identity, ctx) {
        return await this.runInTransaction(ctx, async (tx) => {
            const { user: created } = await this.userRepository.createUserWithProject(user, tx);
            if (identity) {
                await tx.save(tx.create(db_1.AuthIdentity, { ...identity, userId: created.id }));
            }
            return created;
        });
    }
};
exports.ScimUserRepository = ScimUserRepository;
exports.ScimUserRepository = ScimUserRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner, db_1.UserRepository])
], ScimUserRepository);
//# sourceMappingURL=scim-user.repository.js.map