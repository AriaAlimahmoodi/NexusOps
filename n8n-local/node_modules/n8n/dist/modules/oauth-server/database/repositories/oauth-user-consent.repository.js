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
exports.UserConsentRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const oauth_user_consent_entity_1 = require("../entities/oauth-user-consent.entity");
const DAY_IN_MS = 24 * 60 * 60 * 1000;
let UserConsentRepository = class UserConsentRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(oauth_user_consent_entity_1.UserConsent, dataSource.manager, transactionRunner);
    }
    async saveGrant(userId, clientId, scope, ctx) {
        await this.managerFor(ctx).upsert(oauth_user_consent_entity_1.UserConsent, { userId, clientId, scope, grantedAt: Date.now() }, ['userId', 'clientId']);
    }
    async findGrant(userId, clientId, ctx) {
        return await this.managerFor(ctx).findOneBy(oauth_user_consent_entity_1.UserConsent, { userId, clientId });
    }
    async findConnectedClients(options) {
        const qb = this.createQueryBuilder('consent')
            .leftJoinAndSelect('consent.client', 'client')
            .andWhere('client.isFirstParty = :isFirstParty', { isFirstParty: false });
        if (options.withOwner)
            qb.leftJoinAndSelect('consent.user', 'user');
        if (options.userId)
            qb.andWhere('consent.userId = :userId', { userId: options.userId });
        if (options.ownerId)
            qb.andWhere('consent.userId = :ownerId', { ownerId: options.ownerId });
        if (options.clientIds) {
            qb.andWhere('consent.clientId IN (:...clientIds)', { clientIds: options.clientIds });
        }
        if (options.name?.trim()) {
            qb.andWhere('LOWER(client.name) LIKE :name', {
                name: `%${options.name.trim().toLowerCase()}%`,
            });
        }
        if (options.connected === 'last7') {
            qb.andWhere('consent.grantedAt >= :bound', { bound: options.now - 7 * DAY_IN_MS });
        }
        else if (options.connected === 'last30') {
            qb.andWhere('consent.grantedAt >= :bound', { bound: options.now - 30 * DAY_IN_MS });
        }
        else if (options.connected === 'older') {
            qb.andWhere('consent.grantedAt < :bound', { bound: options.now - 30 * DAY_IN_MS });
        }
        qb.orderBy('consent.grantedAt', 'DESC');
        if (options.take !== undefined)
            qb.skip(options.skip ?? 0).take(options.take);
        const [rows, total] = await qb.getManyAndCount();
        return { rows, total };
    }
    async findConsentOwners() {
        return await this.createQueryBuilder('consent')
            .innerJoin('consent.user', 'user')
            .innerJoin('consent.client', 'client')
            .where('client.isFirstParty = :isFirstParty', { isFirstParty: false })
            .select('user.id', 'id')
            .addSelect('user.firstName', 'firstName')
            .addSelect('user.lastName', 'lastName')
            .addSelect('user.email', 'email')
            .distinct(true)
            .getRawMany();
    }
    async countConnectedConsents(userId) {
        return await this.count({
            where: {
                ...(userId ? { userId } : {}),
                client: { isFirstParty: false },
            },
        });
    }
};
exports.UserConsentRepository = UserConsentRepository;
exports.UserConsentRepository = UserConsentRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], UserConsentRepository);
//# sourceMappingURL=oauth-user-consent.repository.js.map