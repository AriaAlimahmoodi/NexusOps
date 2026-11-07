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
exports.InstanceAiEventLogRepository = void 0;
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const instance_ai_event_log_entry_entity_1 = require("../entities/instance-ai-event-log-entry.entity");
let InstanceAiEventLogRepository = class InstanceAiEventLogRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(instance_ai_event_log_entry_entity_1.InstanceAiEventLogEntry, dataSource.manager);
    }
    async maxSeq(threadId) {
        const row = await this.createQueryBuilder('e')
            .select('MAX(e.seq)', 'max')
            .where('e.threadId = :threadId', { threadId })
            .getRawOne();
        return row?.max ?? 0;
    }
    async appendBatch(threadId, firstSeq, events) {
        let bytes = 0;
        const rows = events.map((event, i) => {
            const payload = JSON.stringify(event);
            bytes += Buffer.byteLength(payload, 'utf8');
            return {
                threadId,
                seq: firstSeq + i,
                runId: event.runId,
                type: event.type,
                payload,
            };
        });
        await this.insert(rows);
        return bytes;
    }
    async payloadAt(threadId, seq) {
        const row = await this.findOne({ where: { threadId, seq } });
        return row?.payload ?? null;
    }
    async getAfter(threadId, afterSeq) {
        const rows = await this.find({
            where: { threadId, seq: (0, typeorm_1.MoreThan)(afterSeq) },
            order: { seq: 'ASC' },
        });
        return rows.map((r) => ({ id: r.seq, event: this.toEvent(r) }));
    }
    async getForRuns(threadId, runIds) {
        if (runIds.length === 0)
            return [];
        const rows = await this.createQueryBuilder('e')
            .where('e.threadId = :threadId', { threadId })
            .andWhere('e.runId IN (:...runIds)', { runIds })
            .orderBy('e.seq', 'ASC')
            .getMany();
        return rows.map((r) => this.toEvent(r));
    }
    async getActivityTerminalEvents(threadId, runIds) {
        if (runIds.length === 0)
            return [];
        const rows = await this.createQueryBuilder('e')
            .where('e.threadId = :threadId', { threadId })
            .andWhere('e.runId IN (:...runIds)', { runIds })
            .andWhere('e.type IN (:...types)', { types: ['run-finish', 'agent-completed'] })
            .orderBy('e.seq', 'ASC')
            .getMany();
        return rows.map((row) => this.toEvent(row));
    }
    async getForThreadRuns(threadId, runIds) {
        if (runIds.length === 0)
            return [];
        const rows = await this.createQueryBuilder('e')
            .where('e.threadId = :threadId', { threadId })
            .andWhere('e.runId IN (:...runIds)', { runIds })
            .orderBy('e.seq', 'ASC')
            .getMany();
        return rows.map((r) => ({
            runId: r.runId,
            createdAt: r.createdAt,
            event: this.toEvent(r),
        }));
    }
    async findRunIdsInWindow(threadId, window) {
        const qb = this.createQueryBuilder('e')
            .select('e.runId', 'runId')
            .distinct(true)
            .where('e.threadId = :threadId', { threadId });
        if (window.since)
            qb.andWhere('e.createdAt >= :since', { since: window.since });
        if (window.before)
            qb.andWhere('e.createdAt < :before', { before: window.before });
        const rows = await qb.getRawMany();
        return rows.map((r) => r.runId);
    }
    async getRunStarts(threadId) {
        const rows = await this.find({
            where: { threadId, type: 'run-start' },
            order: { seq: 'ASC' },
        });
        return rows.map((r) => {
            const event = this.toEvent(r);
            const groupId = event.type === 'run-start' ? event.payload.messageGroupId : undefined;
            return {
                runId: r.runId,
                messageGroupId: typeof groupId === 'string' && groupId ? groupId : undefined,
            };
        });
    }
    async findLangsmithAnchor(threadId, responseId) {
        const rows = await this.find({
            where: { threadId, type: 'run-start' },
            order: { seq: 'ASC' },
        });
        const starts = rows.map((r) => this.toEvent(r));
        const isAnchoredRunStart = (e) => e.type === 'run-start' && Boolean(e.payload.langsmithRunId && e.payload.langsmithTraceId);
        const byGroup = starts.find((e) => isAnchoredRunStart(e) && e.payload.messageGroupId === responseId);
        const anchor = byGroup ?? starts.find((e) => e.runId === responseId);
        if (anchor?.type !== 'run-start')
            return undefined;
        const { langsmithRunId, langsmithTraceId } = anchor.payload;
        if (!langsmithRunId || !langsmithTraceId)
            return undefined;
        return { langsmithRunId, langsmithTraceId };
    }
    async getSetupItemsSnapshots(threadId) {
        const rows = await this.find({
            where: { threadId, type: 'setup-items' },
            order: { seq: 'ASC' },
        });
        const latest = new Map();
        for (const row of rows) {
            const event = this.toEvent(row);
            if (event.type !== 'setup-items')
                continue;
            const items = event.payload.items.filter((item) => item !== null);
            latest.delete(event.payload.workflowId);
            latest.set(event.payload.workflowId, items);
        }
        return [...latest.entries()].map(([workflowId, items]) => ({ workflowId, items }));
    }
    async getLastPreferencesInjectionRunId(threadId) {
        const event = await this.findLastPreferencesApplied(threadId);
        if (!event)
            return undefined;
        return event.payload.injectedThisTurn ? event.runId : event.payload.carriedFromRunId;
    }
    async getLastAppliedPreferences(threadId) {
        return (await this.findLastPreferencesApplied(threadId))?.payload;
    }
    async findLastPreferencesApplied(threadId) {
        const row = await this.findOne({
            where: { threadId, type: 'preferences-applied' },
            order: { seq: 'DESC' },
        });
        if (!row)
            return undefined;
        const event = this.toEvent(row);
        return event.type === 'preferences-applied' ? event : undefined;
    }
    async lastFactAt(threadId, runId) {
        const row = await this.createQueryBuilder('e')
            .select('MAX(e.createdAt)', 'max')
            .where('e.threadId = :threadId', { threadId })
            .andWhere('e.runId = :runId', { runId })
            .getRawOne();
        if (!row?.max)
            return null;
        return row.max instanceof Date ? row.max : new Date(row.max);
    }
    async findUnfinishedRuns(threadId) {
        const qb = this.createQueryBuilder('e')
            .select('e.threadId', 'threadId')
            .addSelect('e.runId', 'runId')
            .distinct(true)
            .where("e.type = 'run-start'")
            .andWhere((qb) => 'NOT EXISTS ' +
            qb
                .subQuery()
                .select('1')
                .from(instance_ai_event_log_entry_entity_1.InstanceAiEventLogEntry, 'f')
                .where('f.threadId = e.threadId')
                .andWhere('f.runId = e.runId')
                .andWhere("f.type = 'run-finish'")
                .getQuery());
        if (threadId)
            qb.andWhere('e.threadId = :threadId', { threadId });
        return await qb.getRawMany();
    }
    toEvent(row) {
        const event = (0, n8n_workflow_1.jsonParse)(row.payload);
        event.ts ??= row.createdAt.getTime();
        return event;
    }
};
exports.InstanceAiEventLogRepository = InstanceAiEventLogRepository;
exports.InstanceAiEventLogRepository = InstanceAiEventLogRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InstanceAiEventLogRepository);
//# sourceMappingURL=instance-ai-event-log.repository.js.map