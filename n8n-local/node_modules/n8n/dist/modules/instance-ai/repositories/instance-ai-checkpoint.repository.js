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
exports.InstanceAiCheckpointRepository = void 0;
const node_util_1 = require("node:util");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const instance_ai_checkpoint_entity_1 = require("../entities/instance-ai-checkpoint.entity");
let InstanceAiCheckpointRepository = class InstanceAiCheckpointRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(instance_ai_checkpoint_entity_1.InstanceAiCheckpoint, dataSource.manager);
    }
    async findActiveByThreadId(threadId) {
        return await this.find({
            where: { threadId, expiredAt: (0, typeorm_1.IsNull)() },
            order: { createdAt: 'DESC' },
        });
    }
    async claimSuspendedForResume(key, expectedState) {
        return await this.manager.transaction(async (manager) => {
            const repo = manager.getRepository(instance_ai_checkpoint_entity_1.InstanceAiCheckpoint);
            const row = await repo.findOne({
                where: { key, expiredAt: (0, typeorm_1.IsNull)() },
                ...(manager.connection.options.type === 'postgres'
                    ? { lock: { mode: 'pessimistic_write' } }
                    : {}),
            });
            if (!row?.state ||
                row.state.status !== 'suspended' ||
                !(0, node_util_1.isDeepStrictEqual)(row.state, expectedState)) {
                return false;
            }
            row.state = { ...row.state, status: 'running' };
            await repo.save(row);
            return true;
        });
    }
    async findActiveByResourceId(resourceId) {
        const row = await this.findOne({
            where: { resourceId, expiredAt: (0, typeorm_1.IsNull)() },
            order: { createdAt: 'DESC' },
        });
        return row ?? undefined;
    }
};
exports.InstanceAiCheckpointRepository = InstanceAiCheckpointRepository;
exports.InstanceAiCheckpointRepository = InstanceAiCheckpointRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InstanceAiCheckpointRepository);
//# sourceMappingURL=instance-ai-checkpoint.repository.js.map