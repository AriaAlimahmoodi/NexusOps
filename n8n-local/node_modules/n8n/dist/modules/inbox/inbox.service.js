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
exports.InboxService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const errors_1 = require("@n8n/errors");
const zod_1 = require("zod");
const inbox_source_registry_1 = require("./inbox-source.registry");
const sourceOrder = ['workflow_review', 'self_healing_result'];
const cursorSchema = zod_1.z
    .object({
    version: zod_1.z.literal(2),
    state: api_types_1.inboxStateSchema,
    category: api_types_1.inboxCategorySchema.optional(),
    after: zod_1.z.object({
        updatedAt: zod_1.z.string().datetime(),
        type: api_types_1.inboxSourceTypeSchema,
        id: zod_1.z.string().min(1).max(128),
    }),
    activeSources: zod_1.z.array(api_types_1.inboxSourceTypeSchema).min(1).max(sourceOrder.length),
    failedSources: zod_1.z.array(api_types_1.inboxSourceTypeSchema).max(sourceOrder.length),
})
    .strict();
class InboxUnavailableError extends errors_1.ServiceUnavailableError {
    constructor(status) {
        super('Inbox is temporarily unavailable');
        this.meta = { ...status };
    }
}
let InboxService = class InboxService {
    constructor(registry, logger) {
        this.registry = registry;
        this.logger = logger;
    }
    async list(user, query) {
        const sourceTypes = this.sourcesForCategory(query.category);
        const cursor = query.cursor
            ? this.decodeCursor(query.cursor, query.state, query.category, sourceTypes)
            : undefined;
        const { available, failedSources: unavailableSources, disabledSources, } = await this.registry.getAllAvailable(cursor?.activeSources ?? this.registry.types().filter((type) => sourceTypes.includes(type)));
        const results = await Promise.allSettled(available.map(async (source) => await source.list(user, {
            state: query.state,
            ...(query.category !== undefined ? { category: query.category } : {}),
            limit: query.limit + 1,
            boundary: this.boundaryFor(source.type, cursor?.after),
        })));
        const successful = [];
        const failedSources = [...new Set([...(cursor?.failedSources ?? []), ...unavailableSources])];
        for (const [index, source] of available.entries()) {
            const result = results[index];
            if (result.status === 'rejected') {
                this.logger.warn('Inbox source list failed', { type: source.type, error: result.reason });
                failedSources.push(source.type);
            }
            else {
                successful.push({ type: source.type, items: result.value });
            }
        }
        const status = {
            partial: failedSources.length > 0,
            failedSources,
            disabledSources,
        };
        if (successful.length === 0 && status.partial) {
            throw new InboxUnavailableError(status);
        }
        const rows = this.mergeRows(successful.map(({ items }) => items), query.limit + 1);
        const data = rows.slice(0, query.limit);
        const hasMore = rows.length > query.limit;
        const last = data.at(-1);
        return {
            ...status,
            data,
            hasMore,
            nextCursor: hasMore && last
                ? this.encodeCursor({
                    version: 2,
                    state: query.state,
                    ...(query.category !== undefined ? { category: query.category } : {}),
                    after: { updatedAt: last.updatedAt, type: last.type, id: last.id },
                    activeSources: successful.map(({ type }) => type),
                    failedSources,
                })
                : null,
        };
    }
    async getSummary(user) {
        const { available, failedSources, disabledSources } = await this.registry.getAllAvailable();
        const results = await Promise.allSettled(available.map(async (source) => await source.count(user)));
        const counts = { open: 0, closed: 0 };
        let successfulReads = 0;
        for (const [index, source] of available.entries()) {
            const result = results[index];
            if (result.status === 'rejected') {
                this.logger.warn('Inbox source count failed', { type: source.type, error: result.reason });
                failedSources.push(source.type);
            }
            else {
                successfulReads++;
                counts.open += result.value.open;
                counts.closed += result.value.closed;
            }
        }
        const status = {
            partial: failedSources.length > 0,
            failedSources,
            disabledSources,
        };
        if (successfulReads === 0 && status.partial) {
            throw new InboxUnavailableError(status);
        }
        return { ...status, counts: status.partial ? null : counts };
    }
    async getSettings() {
        const { available, failedSources } = await this.registry.getAllAvailable();
        return {
            enabled: available.length > 0 || failedSources.length > 0,
            availableTypes: available.map(({ type }) => type),
            failedTypes: failedSources,
        };
    }
    boundaryFor(type, after) {
        if (!after)
            return undefined;
        const updatedAt = new Date(after.updatedAt);
        if (type === after.type)
            return { mode: 'afterItem', updatedAt, id: after.id };
        return {
            mode: sourceOrder.indexOf(type) > sourceOrder.indexOf(after.type)
                ? 'beforeOrAtTime'
                : 'beforeTime',
            updatedAt,
        };
    }
    mergeRows(pages, limit) {
        return pages
            .flat()
            .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) ||
            sourceOrder.indexOf(left.type) - sourceOrder.indexOf(right.type))
            .slice(0, limit);
    }
    encodeCursor(cursor) {
        return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url');
    }
    sourcesForCategory(category) {
        return category === 'authored' ? ['workflow_review'] : sourceOrder;
    }
    decodeCursor(value, state, category, sourceTypes) {
        try {
            if (value.length > 2048 || !/^[\w-]+$/.test(value)) {
                throw new errors_1.BadRequestError('Invalid Inbox pagination cursor');
            }
            const cursor = cursorSchema.parse(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')));
            const sources = [...cursor.activeSources, ...cursor.failedSources];
            if (cursor.state !== state ||
                cursor.category !== category ||
                sources.some((type) => !sourceTypes.includes(type)) ||
                new Set(sources).size !== sources.length ||
                !cursor.activeSources.includes(cursor.after.type)) {
                throw new errors_1.BadRequestError('Invalid Inbox pagination cursor');
            }
            return cursor;
        }
        catch {
            throw new errors_1.BadRequestError('Invalid Inbox pagination cursor');
        }
    }
};
exports.InboxService = InboxService;
exports.InboxService = InboxService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [inbox_source_registry_1.InboxSourceRegistry, backend_common_1.Logger])
], InboxService);
//# sourceMappingURL=inbox.service.js.map