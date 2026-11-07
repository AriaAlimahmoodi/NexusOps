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
exports.InstanceAiConversationHistoryRepository = void 0;
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const conversation_history_search_1 = require("./conversation-history-search");
const instance_ai_message_entity_1 = require("../entities/instance-ai-message.entity");
const instance_ai_thread_entity_1 = require("../entities/instance-ai-thread.entity");
const CONVERSATION_ROLES = ['user', 'assistant'];
const WINDOW_OVERFETCH_FACTOR = 4;
let InstanceAiConversationHistoryRepository = class InstanceAiConversationHistoryRepository {
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async searchProjectThreadsForUser(params) {
        return await this.pageByRecency(() => this.buildSearchQuery(params), params.limit);
    }
    async listRecentProjectThreadsForUser(params) {
        return await this.pageByRecency(() => this.scopedThreads(params), params.limit);
    }
    async countProjectThreadsForUser(scope) {
        return await this.scopedThreads(scope).getCount();
    }
    async findOwnedThread(threadId, userId, projectId) {
        return await this.threads()
            .where('t.id = :threadId', { threadId })
            .andWhere('t.resourceId = :userId', { userId })
            .andWhere('t.projectId = :projectId', { projectId })
            .getOne();
    }
    async findSearchMatchRows(threadIds, query, maxRowsPerThread) {
        const byThread = new Map();
        if (maxRowsPerThread <= 0)
            return byThread;
        for (const threadId of threadIds) {
            const rows = await this.orderMessages(this.messages(), 'DESC')
                .where('m.threadId = :threadId', { threadId })
                .andWhere((0, conversation_history_search_1.buildMessageMatchCondition)('m'), {
                pattern: (0, conversation_history_search_1.buildSearchLikePattern)(query),
                ...conversation_history_search_1.ASK_USER_CONTENT_MARKERS,
            })
                .take(maxRowsPerThread)
                .getMany();
            byThread.set(threadId, rows);
        }
        return byThread;
    }
    async findFirstUserMessages(threadIds) {
        const byThread = new Map();
        for (const threadId of threadIds) {
            const row = await this.orderMessages(this.messages(), 'ASC')
                .where('m.threadId = :threadId', { threadId })
                .andWhere("m.role = 'user'")
                .take(1)
                .getOne();
            if (row)
                byThread.set(threadId, row);
        }
        return byThread;
    }
    async findMessageInThread(threadId, messageId) {
        return await this.conversationRows(threadId)
            .andWhere('m.id = :messageId', { messageId })
            .getOne();
    }
    async getConversationWindow(params) {
        const { threadId, anchor, before, after, project } = params;
        if (!anchor) {
            if (before > 0) {
                const tail = await this.fetchWindowSide(threadId, 'older', before, project);
                return { rows: tail.rows, hasMoreBefore: tail.hasMore, hasMoreAfter: false };
            }
            const head = await this.fetchWindowSide(threadId, 'newer', after, project);
            return { rows: head.rows, hasMoreBefore: false, hasMoreAfter: head.hasMore };
        }
        const [anchorAndOlder, newer] = await Promise.all([
            this.fetchWindowSide(threadId, 'older', before + 1, project, {
                anchor,
                includeAnchor: true,
            }),
            this.fetchWindowSide(threadId, 'newer', after, project, { anchor }),
        ]);
        return {
            rows: [...anchorAndOlder.rows, ...newer.rows],
            hasMoreBefore: anchorAndOlder.hasMore,
            hasMoreAfter: newer.hasMore,
        };
    }
    async pageByRecency(scope, limit) {
        const threads = await scope()
            .orderBy('t.updatedAt', 'DESC')
            .addOrderBy('t.id', 'DESC')
            .limit(limit)
            .getMany();
        return threads.map((thread) => ({
            id: thread.id,
            title: thread.title,
            updatedAt: thread.updatedAt,
        }));
    }
    scopedThreads(scope) {
        const qb = this.threads();
        const hasMessages = qb
            .subQuery()
            .select('1')
            .from(instance_ai_message_entity_1.InstanceAiMessage, 'started')
            .where('started.threadId = t.id')
            .getQuery();
        return qb
            .where('t.resourceId = :userId', { userId: scope.userId })
            .andWhere('t.projectId = :projectId', { projectId: scope.projectId })
            .andWhere('t.id != :excludeThreadId', { excludeThreadId: scope.excludeThreadId })
            .andWhere(`EXISTS ${hasMessages}`);
    }
    buildSearchQuery(params) {
        const qb = this.scopedThreads(params);
        const messageMatch = qb
            .subQuery()
            .select('1')
            .from(instance_ai_message_entity_1.InstanceAiMessage, 'm')
            .where('m.threadId = t.id')
            .andWhere((0, conversation_history_search_1.buildMessageMatchCondition)('m'))
            .getQuery();
        return qb
            .andWhere(`(LOWER(t.title) LIKE :pattern ${db_1.LIKE_ESCAPE_CLAUSE} OR EXISTS ${messageMatch})`)
            .setParameters({
            pattern: (0, conversation_history_search_1.buildSearchLikePattern)(params.query),
            ...conversation_history_search_1.ASK_USER_CONTENT_MARKERS,
        });
    }
    async fetchWindowSide(threadId, direction, limit, project, boundary) {
        const qb = this.conversationRows(threadId);
        if (boundary) {
            const timeOp = direction === 'older' ? '<' : '>';
            const idOp = direction === 'older' ? (boundary.includeAnchor ? '<=' : '<') : '>';
            qb.andWhere(`(m.createdAt ${timeOp} :anchorAt OR (m.createdAt = :anchorAt AND m.id ${idOp} :anchorId))`, { anchorAt: boundary.anchor.createdAt, anchorId: boundary.anchor.id });
        }
        const sqlOrder = direction === 'older' ? 'DESC' : 'ASC';
        const fetchLimit = limit * WINDOW_OVERFETCH_FACTOR + 1;
        const fetched = await this.orderMessages(qb, sqlOrder).take(fetchLimit).getMany();
        const rows = [];
        let moreVisibleFetched = false;
        for (const row of fetched) {
            const item = project(row);
            if (item === undefined)
                continue;
            if (rows.length < limit)
                rows.push(item);
            else {
                moreVisibleFetched = true;
                break;
            }
        }
        const hasMore = moreVisibleFetched || fetched.length === fetchLimit;
        return { rows: direction === 'older' ? rows.reverse() : rows, hasMore };
    }
    conversationRows(threadId) {
        return this.messages()
            .where('m.threadId = :threadId', { threadId })
            .andWhere('m.role IN (:...roles)', { roles: CONVERSATION_ROLES })
            .andWhere((0, conversation_history_search_1.buildVisibleRowCondition)('m'), conversation_history_search_1.VISIBLE_ROW_MARKERS);
    }
    orderMessages(qb, order) {
        return qb.orderBy('m.createdAt', order).addOrderBy('m.id', order);
    }
    threads() {
        return this.dataSource.createQueryBuilder(instance_ai_thread_entity_1.InstanceAiThread, 't');
    }
    messages() {
        return this.dataSource.createQueryBuilder(instance_ai_message_entity_1.InstanceAiMessage, 'm');
    }
};
exports.InstanceAiConversationHistoryRepository = InstanceAiConversationHistoryRepository;
exports.InstanceAiConversationHistoryRepository = InstanceAiConversationHistoryRepository = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], InstanceAiConversationHistoryRepository);
//# sourceMappingURL=instance-ai-conversation-history.repository.js.map