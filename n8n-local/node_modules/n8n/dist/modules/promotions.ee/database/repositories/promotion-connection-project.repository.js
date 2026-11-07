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
exports.PromotionConnectionProjectRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promotion_connection_project_entity_1 = require("../entities/promotion-connection-project.entity");
const promotion_conflict_error_1 = require("../promotion-conflict.error");
let PromotionConnectionProjectRepository = class PromotionConnectionProjectRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(promotion_connection_project_entity_1.PromotionConnectionProject, dataSource.manager, transactionRunner);
    }
    async findByProjectId(projectId, ctx = {}) {
        return await this.managerFor(ctx).findOne(promotion_connection_project_entity_1.PromotionConnectionProject, {
            where: { projectId },
        });
    }
    async linkProject(projectId, connectionId) {
        const link = this.create({ projectId, connectionId });
        await this.createQueryBuilder().insert().values(link).orIgnore().execute();
        const stored = await this.findOneByOrFail({ projectId });
        if (stored.connectionId !== connectionId) {
            throw new promotion_conflict_error_1.PromotionConflictError('project-link', 'This project is already linked to another promotion connection');
        }
        return stored;
    }
    async unlinkProject(projectId, connectionId) {
        const result = await this.delete({ projectId, connectionId });
        return result.affected ?? 0;
    }
    async findProjectIdsByConnection(connectionId) {
        const rows = await this.find({
            where: { connectionId },
            select: { projectId: true },
            order: { projectId: 'ASC' },
        });
        return rows.map((row) => row.projectId);
    }
};
exports.PromotionConnectionProjectRepository = PromotionConnectionProjectRepository;
exports.PromotionConnectionProjectRepository = PromotionConnectionProjectRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], PromotionConnectionProjectRepository);
//# sourceMappingURL=promotion-connection-project.repository.js.map