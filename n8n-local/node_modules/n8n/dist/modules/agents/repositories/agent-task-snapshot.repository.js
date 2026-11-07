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
exports.AgentTaskSnapshotRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const agent_task_snapshot_entity_1 = require("../entities/agent-task-snapshot.entity");
let AgentTaskSnapshotRepository = class AgentTaskSnapshotRepository extends db_1.BaseRepository {
    constructor(dataSource, transactionRunner) {
        super(agent_task_snapshot_entity_1.AgentTaskSnapshot, dataSource.manager, transactionRunner);
    }
    async saveForVersion(snapshots, ctx = {}) {
        if (snapshots.length === 0)
            return;
        const repo = this.managerFor(ctx).getRepository(agent_task_snapshot_entity_1.AgentTaskSnapshot);
        await repo.insert(snapshots);
    }
    async findByVersionId(versionId, ctx = {}) {
        const repo = this.managerFor(ctx).getRepository(agent_task_snapshot_entity_1.AgentTaskSnapshot);
        return await repo.find({ where: { versionId }, order: { createdAt: 'ASC' } });
    }
    async findEnabledByVersionId(versionId) {
        return await this.find({
            where: { versionId, enabled: true },
            order: { createdAt: 'ASC' },
        });
    }
    async findByVersionAndTaskId(versionId, taskId) {
        return await this.findOne({ where: { versionId, taskId } });
    }
};
exports.AgentTaskSnapshotRepository = AgentTaskSnapshotRepository;
exports.AgentTaskSnapshotRepository = AgentTaskSnapshotRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, db_1.TransactionRunner])
], AgentTaskSnapshotRepository);
//# sourceMappingURL=agent-task-snapshot.repository.js.map