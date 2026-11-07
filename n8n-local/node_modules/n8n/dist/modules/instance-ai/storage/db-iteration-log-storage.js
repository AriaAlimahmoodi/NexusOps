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
exports.DbIterationLogStorage = void 0;
const di_1 = require("@n8n/di");
const generate_nano_id_1 = require("@n8n/utils/generate-nano-id");
const n8n_workflow_1 = require("n8n-workflow");
const instance_ai_iteration_log_repository_1 = require("../repositories/instance-ai-iteration-log.repository");
let DbIterationLogStorage = class DbIterationLogStorage {
    constructor(repo) {
        this.repo = repo;
    }
    async append(threadId, taskKey, entry) {
        await this.repo.insert({
            id: (0, generate_nano_id_1.generateNanoId)(),
            threadId,
            taskKey,
            entry: JSON.stringify(entry),
        });
    }
    async getForTask(threadId, taskKey) {
        const rows = await this.repo.find({
            where: { threadId, taskKey },
            order: { createdAt: 'ASC' },
        });
        return rows.map((r) => (0, n8n_workflow_1.jsonParse)(r.entry));
    }
    async clear(threadId) {
        await this.repo.delete({ threadId });
    }
};
exports.DbIterationLogStorage = DbIterationLogStorage;
exports.DbIterationLogStorage = DbIterationLogStorage = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [instance_ai_iteration_log_repository_1.InstanceAiIterationLogRepository])
], DbIterationLogStorage);
//# sourceMappingURL=db-iteration-log-storage.js.map