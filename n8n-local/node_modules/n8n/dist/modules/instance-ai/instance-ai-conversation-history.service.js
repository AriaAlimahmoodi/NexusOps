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
exports.InstanceAiConversationHistoryService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const di_1 = require("@n8n/di");
const is_record_1 = require("@n8n/utils/is-record");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const conversation_history_content_1 = require("./conversation-history-content");
const internal_messages_1 = require("./internal-messages");
const message_parser_1 = require("./message-parser");
const instance_ai_conversation_history_repository_1 = require("./repositories/instance-ai-conversation-history.repository");
const EXCERPT_LENGTH = 200;
const MAX_EXCERPTS_PER_THREAD = 3;
const EXCERPT_CANDIDATES_PER_THREAD = 8;
const MAX_SEARCH_LIMIT = 10;
const MAX_WINDOW_SIDE = 5;
const THREAD_PAGE_OVERFETCH_FACTOR = 2;
const DEFAULT_SEARCH_LIMIT = 10;
const DEFAULT_LIST_LIMIT = 5;
const DEFAULT_WINDOW_SIDE = MAX_WINDOW_SIDE;
const USER_TEXT_LIMIT = 1500;
const ASSISTANT_TEXT_LIMIT = 800;
const THREAD_NOT_FOUND = 'Conversation not found';
const PAST_CONVERSATIONS_HINT_LIMIT = 3;
const AGE_WEEKS_THRESHOLD_DAYS = 14;
const askUserAnswerSchema = zod_1.z.object({
    question: zod_1.z.string(),
    selectedOptions: zod_1.z.array(zod_1.z.string()),
    customText: zod_1.z.string().optional(),
    skipped: zod_1.z.boolean().optional(),
});
const askUserPartSchema = zod_1.z.object({
    type: zod_1.z.literal('tool-call'),
    toolName: zod_1.z.string().refine((name) => conversation_history_content_1.ASK_USER_TOOL_NAMES.includes(name)),
    state: zod_1.z.literal('resolved'),
    output: zod_1.z.object({
        answered: zod_1.z.boolean(),
        answers: zod_1.z.array(askUserAnswerSchema).optional(),
    }),
});
function parseStoredContent(raw) {
    const parsed = (0, n8n_workflow_1.jsonParse)(raw, { fallbackValue: null });
    if (!(0, is_record_1.isRecord)(parsed))
        return undefined;
    return { content: parsed.content };
}
function extractUserText(content) {
    return (0, internal_messages_1.cleanStoredUserMessage)((0, message_parser_1.extractTextFromContent)(content));
}
function hasToolActivity(content) {
    if (!Array.isArray(content))
        return false;
    return content.some((part) => (0, is_record_1.isRecord)(part) && typeof part.type === 'string' && conversation_history_content_1.TOOL_CALL_PART_TYPES.includes(part.type));
}
function renderAnswer(answer) {
    const chosen = [...answer.selectedOptions];
    if (answer.customText)
        chosen.push(answer.customText);
    const rendered = chosen.join(', ');
    if (answer.skipped)
        return rendered ? `${rendered} (skipped)` : '(skipped)';
    return rendered;
}
function extractAskUserAnswers(content) {
    if (!Array.isArray(content))
        return [];
    return content.flatMap((part) => {
        const parsed = askUserPartSchema.safeParse(part);
        if (!parsed.success)
            return [];
        return (parsed.data.output.answers ?? []).map((answer) => ({
            question: answer.question,
            answer: renderAnswer(answer),
        }));
    });
}
function formatQuestionAndAnswer(pair) {
    return `Q: ${pair.question} → A: ${pair.answer}`;
}
function truncate(text, limit) {
    return text.length <= limit ? text : `${text.slice(0, limit)}…`;
}
function centerExcerpt(text, matchIndex, matchLength) {
    if (text.length <= EXCERPT_LENGTH)
        return text;
    const padding = Math.max(0, Math.floor((EXCERPT_LENGTH - matchLength) / 2));
    const end = Math.min(text.length, Math.max(0, matchIndex - padding) + EXCERPT_LENGTH);
    const start = Math.max(0, end - EXCERPT_LENGTH);
    return `${start > 0 ? '…' : ''}${text.slice(start, end)}${end < text.length ? '…' : ''}`;
}
function clampSearchLimit(limit) {
    return Math.max(1, Math.min(MAX_SEARCH_LIMIT, Math.floor(limit)));
}
function clampWindowSide(value) {
    return Math.max(0, Math.min(MAX_WINDOW_SIDE, Math.floor(value)));
}
function firstMessageExcerpt(first) {
    if (!first)
        return undefined;
    const parsed = parseStoredContent(first.content);
    if (!parsed)
        return undefined;
    const text = extractUserText(parsed.content)?.trim();
    return text ? truncate(text, EXCERPT_LENGTH) : undefined;
}
function formatConversationAge(updatedAt, nowMs) {
    const days = Math.floor(Math.max(0, nowMs - updatedAt.getTime()) / constants_1.Time.days.toMilliseconds);
    if (days === 0)
        return 'today';
    if (days < AGE_WEEKS_THRESHOLD_DAYS)
        return `${days}d ago`;
    return `${Math.floor(days / 7)}w ago`;
}
let InstanceAiConversationHistoryService = class InstanceAiConversationHistoryService {
    constructor(logger, repository) {
        this.repository = repository;
        this.logger = logger.scoped('instance-ai');
    }
    forContext(userId, projectId, currentThreadId) {
        return {
            search: async (params) => await this.search(userId, projectId, currentThreadId, params.query, params.limit),
            getMessages: async (params) => await this.getMessages(userId, projectId, params),
            getPastConversationsSection: async () => await this.getPastConversationsSection(userId, projectId, currentThreadId),
        };
    }
    async getPastConversationsSection(userId, projectId, currentThreadId) {
        try {
            const scope = { userId, projectId, excludeThreadId: currentThreadId };
            const rows = await this.repository.listRecentProjectThreadsForUser({
                ...scope,
                limit: PAST_CONVERSATIONS_HINT_LIMIT,
            });
            if (rows.length === 0)
                return undefined;
            const total = rows.length < PAST_CONVERSATIONS_HINT_LIMIT
                ? rows.length
                : await this.repository.countProjectThreadsForUser(scope);
            const nowMs = Date.now();
            const recent = rows
                .map((row) => `"${(0, internal_messages_1.sanitisePromptText)(row.title.trim()) || '(untitled)'}" (${formatConversationAge(row.updatedAt, nowMs)})`)
                .join(', ');
            const count = total === 1 ? '1 past conversation' : `${total} past conversations`;
            return `This project has ${count} with you. Most recent: ${recent}.`;
        }
        catch (error) {
            this.logger.warn('Instance AI could not build the past-conversations hint for this turn', {
                projectId,
                threadId: currentThreadId,
                error: error instanceof Error ? error.message : String(error),
            });
            return undefined;
        }
    }
    async search(userId, projectId, currentThreadId, query, limit) {
        const trimmedQuery = query?.trim() ?? '';
        if (trimmedQuery.length === 0) {
            return await this.listRecent(userId, projectId, currentThreadId, limit ?? DEFAULT_LIST_LIMIT);
        }
        const pageLimit = clampSearchLimit(limit ?? DEFAULT_SEARCH_LIMIT);
        const rows = await this.repository.searchProjectThreadsForUser({
            userId,
            projectId,
            excludeThreadId: currentThreadId,
            query: trimmedQuery,
            limit: pageLimit * THREAD_PAGE_OVERFETCH_FACTOR,
        });
        const page = await this.verifyHits(rows, trimmedQuery, pageLimit);
        const firstUserMessages = await this.repository.findFirstUserMessages(page.map((hit) => hit.row.id));
        return { hits: page.map((hit) => buildHit(hit, firstUserMessages)) };
    }
    async verifyHits(rows, query, pageLimit) {
        const needle = query.toLowerCase();
        const verified = [];
        let dropped = 0;
        for (let start = 0; start < rows.length && verified.length < pageLimit; start += pageLimit) {
            const batch = rows.slice(start, start + pageLimit);
            const candidatesByThread = await this.repository.findSearchMatchRows(batch.map((row) => row.id), query, EXCERPT_CANDIDATES_PER_THREAD);
            for (const row of batch) {
                const extracted = this.buildExcerpts(candidatesByThread.get(row.id) ?? [], query);
                const titleMatched = row.title.toLowerCase().includes(needle);
                if (!titleMatched && extracted.excerpts.length === 0) {
                    dropped++;
                    continue;
                }
                verified.push({ row, titleMatched, ...extracted });
            }
        }
        if (dropped > 0) {
            this.logger.debug('Dropped conversation-history hits with no verified match', { dropped });
        }
        return verified.slice(0, pageLimit);
    }
    async listRecent(userId, projectId, currentThreadId, limit) {
        const rows = await this.repository.listRecentProjectThreadsForUser({
            userId,
            projectId,
            excludeThreadId: currentThreadId,
            limit: clampSearchLimit(limit),
        });
        const firstUserMessages = await this.repository.findFirstUserMessages(rows.map((row) => row.id));
        const hits = rows.map((row) => baseHit(row, firstUserMessages));
        return { hits };
    }
    buildExcerpts(candidates, query) {
        const needle = query.toLowerCase();
        const excerpts = [];
        let matchedInMessages = false;
        let matchedInAnswers = false;
        for (const row of candidates) {
            const parsed = parseStoredContent(row.content);
            if (!parsed)
                continue;
            const isUserRow = row.role === 'user';
            const text = isUserRow
                ? (extractUserText(parsed.content) ?? '')
                : extractAskUserAnswers(parsed.content).map(formatQuestionAndAnswer).join('\n');
            const matchIndex = text.toLowerCase().indexOf(needle);
            if (matchIndex === -1)
                continue;
            if (isUserRow)
                matchedInMessages = true;
            else
                matchedInAnswers = true;
            if (excerpts.length < MAX_EXCERPTS_PER_THREAD) {
                excerpts.push({
                    messageId: row.id,
                    text: centerExcerpt(text, matchIndex, needle.length),
                    createdAt: row.createdAt.toISOString(),
                });
            }
        }
        return { excerpts, matchedInMessages, matchedInAnswers };
    }
    async getMessages(userId, projectId, params) {
        const [thread, anchorRow] = await Promise.all([
            this.repository.findOwnedThread(params.threadId, userId, projectId),
            params.aroundMessageId
                ? this.repository.findMessageInThread(params.threadId, params.aroundMessageId)
                : null,
        ]);
        if (!thread) {
            throw new n8n_workflow_1.UserError(THREAD_NOT_FOUND);
        }
        if (params.aroundMessageId && !anchorRow) {
            throw new n8n_workflow_1.UserError('Message not found in this conversation');
        }
        const { before, after } = this.resolveWindow(anchorRow !== null, params.before, params.after);
        const window = await this.repository.getConversationWindow({
            threadId: params.threadId,
            anchor: anchorRow ? { createdAt: anchorRow.createdAt, id: anchorRow.id } : undefined,
            before,
            after,
            project: toHistoryMessage,
        });
        return {
            threadId: thread.id,
            title: thread.title,
            messages: window.rows,
            hasMoreBefore: window.hasMoreBefore,
            hasMoreAfter: window.hasMoreAfter,
        };
    }
    resolveWindow(hasAnchor, before, after) {
        if (before === undefined && after === undefined) {
            return { before: DEFAULT_WINDOW_SIDE, after: hasAnchor ? DEFAULT_WINDOW_SIDE : 0 };
        }
        return { before: clampWindowSide(before ?? 0), after: clampWindowSide(after ?? 0) };
    }
};
exports.InstanceAiConversationHistoryService = InstanceAiConversationHistoryService;
exports.InstanceAiConversationHistoryService = InstanceAiConversationHistoryService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, instance_ai_conversation_history_repository_1.InstanceAiConversationHistoryRepository])
], InstanceAiConversationHistoryService);
function baseHit(row, firstUserMessages) {
    const openingExcerpt = firstMessageExcerpt(firstUserMessages.get(row.id));
    return {
        threadId: row.id,
        title: row.title,
        updatedAt: row.updatedAt.toISOString(),
        matchedIn: [],
        ...(openingExcerpt ? { firstMessageExcerpt: openingExcerpt } : {}),
        excerpts: [],
    };
}
function buildHit(hit, firstUserMessages) {
    const { row, titleMatched, excerpts, matchedInMessages, matchedInAnswers } = hit;
    const matchedIn = [];
    if (titleMatched)
        matchedIn.push('title');
    if (matchedInMessages)
        matchedIn.push('messages');
    if (matchedInAnswers)
        matchedIn.push('user-answers');
    return {
        ...baseHit(row, firstUserMessages),
        matchedIn,
        excerpts,
    };
}
function toHistoryMessage(row) {
    if (row.role !== 'user' && row.role !== 'assistant')
        return undefined;
    const parsed = parseStoredContent(row.content);
    if (!parsed)
        return undefined;
    const isUserRow = row.role === 'user';
    const userAnswers = isUserRow ? [] : extractAskUserAnswers(parsed.content);
    const text = isUserRow ? extractUserText(parsed.content) : (0, message_parser_1.extractTextFromContent)(parsed.content);
    if (text === null)
        return undefined;
    if (!isUserRow && userAnswers.length === 0 && hasToolActivity(parsed.content)) {
        return undefined;
    }
    if (text.trim().length === 0 && userAnswers.length === 0)
        return undefined;
    return {
        messageId: row.id,
        role: isUserRow ? 'user' : 'assistant',
        createdAt: row.createdAt.toISOString(),
        text: truncate(text, isUserRow ? USER_TEXT_LIMIT : ASSISTANT_TEXT_LIMIT),
        ...(userAnswers.length > 0 ? { userAnswers } : {}),
    };
}
//# sourceMappingURL=instance-ai-conversation-history.service.js.map