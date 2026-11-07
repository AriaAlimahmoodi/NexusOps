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
exports.TrustedSourceIdentityRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const trusted_source_identity_entity_1 = require("../entities/trusted-source-identity.entity");
class TrustedSourceIdentityStore extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(trusted_source_identity_entity_1.TrustedSourceIdentityEntity, dataSource.manager, transactionRunner);
    }
    managerFor(ctx) {
        return super.managerFor(ctx);
    }
}
let TrustedSourceIdentityRepository = class TrustedSourceIdentityRepository {
    constructor(dataSource, transactionRunner, users) {
        this.users = users;
        this.store = new TrustedSourceIdentityStore(dataSource, transactionRunner);
    }
    async findBinding(sourceId, subject, ctx = {}) {
        return await this.store.managerFor(ctx).findOne(trusted_source_identity_entity_1.TrustedSourceIdentityEntity, {
            select: ['userId', 'status'],
            where: { sourceId, subject },
        });
    }
    async clearByTrustedSourceId(trustedSourceId, ctx = {}) {
        await this.store
            .managerFor(ctx)
            .delete(trusted_source_identity_entity_1.TrustedSourceIdentityEntity, { sourceId: trustedSourceId });
    }
    async findBySubject(sourceId, subject, ctx = {}) {
        return await this.store.managerFor(ctx).findOne(trusted_source_identity_entity_1.TrustedSourceIdentityEntity, {
            where: { sourceId, subject },
            relations: {
                user: {
                    role: true,
                },
            },
        });
    }
    async findUserByEmail(email, ctx = {}) {
        return await this.store
            .managerFor(ctx)
            .findOne(db_1.User, { where: { email }, relations: { role: true } });
    }
    async globalRoleExists(slug, ctx = {}) {
        return await this.store.managerFor(ctx).exists(db_1.Role, { where: { slug, roleType: 'global' } });
    }
    async projectRolesExist(slugs, ctx = {}) {
        const unique = [...new Set(slugs)];
        if (unique.length === 0)
            return true;
        const count = await this.store
            .managerFor(ctx)
            .count(db_1.Role, { where: { slug: (0, typeorm_1.In)(unique), roleType: 'project' } });
        return count === unique.length;
    }
    async touchLastSeen(sourceId, subject, seenAt, ctx = {}) {
        await this.store
            .managerFor(ctx)
            .update(trusted_source_identity_entity_1.TrustedSourceIdentityEntity, { sourceId, subject }, { lastSeenAt: seenAt });
    }
    async insertIfAbsent(row, ctx = {}) {
        await this.store
            .managerFor(ctx)
            .createQueryBuilder()
            .insert()
            .into(trusted_source_identity_entity_1.TrustedSourceIdentityEntity)
            .values(row)
            .orIgnore()
            .execute();
    }
    async createUserWithBinding(ctx, user, binding, projectRoles = []) {
        return await this.store.runInTransaction(ctx, async (tx) => {
            const { user: createdUser } = await this.users.createUserWithProject(user, tx);
            await tx.insert(trusted_source_identity_entity_1.TrustedSourceIdentityEntity, {
                ...binding,
                userId: createdUser.id,
            });
            for (const { projectId, role } of projectRoles) {
                await tx.save(db_1.ProjectRelation, {
                    userId: createdUser.id,
                    projectId,
                    role: {
                        slug: role,
                    },
                });
            }
            return createdUser;
        });
    }
};
exports.TrustedSourceIdentityRepository = TrustedSourceIdentityRepository;
exports.TrustedSourceIdentityRepository = TrustedSourceIdentityRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner, db_1.UserRepository])
], TrustedSourceIdentityRepository);
//# sourceMappingURL=trusted-source-identity.repository.js.map