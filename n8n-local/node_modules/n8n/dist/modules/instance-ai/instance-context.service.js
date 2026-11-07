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
exports.InstanceContextService = exports.INSTANCE_CONTEXT_CURSOR = void 0;
exports.readInstanceContextCursor = readInstanceContextCursor;
exports.toContextInjection = toContextInjection;
exports.shouldTraceContextInjection = shouldTraceContextInjection;
const backend_common_1 = require("@n8n/backend-common");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const is_record_1 = require("@n8n/utils/is-record");
const check_access_1 = require("../../permissions.ee/check-access");
const project_service_ee_1 = require("../../services/project.service.ee");
const internal_messages_1 = require("./internal-messages");
const windowSize = 40;
const fetchMultiplier = 4;
const withheldFetchMultiplier = 4;
const maxAgeMs = 7 * constants_1.Time.days.toMilliseconds;
const mcpRunWindowMs = 24 * constants_1.Time.hours.toMilliseconds;
const runWorkflowCap = 12;
const inventorySize = 8;
const resourceHistoryLimit = 20;
const seenIdsCap = 200;
const entryFetchLimit = windowSize * fetchMultiplier;
exports.INSTANCE_CONTEXT_CURSOR = 'instanceContext';
function readInstanceContextCursor(metadata) {
    const value = metadata?.[exports.INSTANCE_CONTEXT_CURSOR];
    if (!(0, is_record_1.isRecord)(value))
        return null;
    const { activityMark, activityFloor, activityCategories, activitySeen, runsThrough } = value;
    if (typeof activityMark !== 'number' || !Number.isFinite(activityMark))
        return null;
    if (typeof activityFloor !== 'number' || !Number.isFinite(activityFloor))
        return null;
    if (!Array.isArray(activityCategories))
        return null;
    if (typeof runsThrough !== 'string' || Number.isNaN(Date.parse(runsThrough)))
        return null;
    return {
        activityMark,
        activityFloor,
        activityCategories: activityCategories.filter(isKnownCategory),
        activitySeen: Array.isArray(activitySeen)
            ? activitySeen.filter((id) => typeof id === 'number' && Number.isFinite(id))
            : [],
        ...(typeof value.activitySeenFloor === 'number' && Number.isFinite(value.activitySeenFloor)
            ? { activitySeenFloor: value.activitySeenFloor }
            : {}),
        runsThrough,
    };
}
function toContextInjection(result) {
    if (result.state === 'absent')
        return { state: 'absent', reason: result.reason };
    return {
        state: 'injected',
        isUpdate: result.isUpdate,
        legs: result.legs,
        chars: result.block.length,
    };
}
const TRACED_ABSENCE_REASONS = {
    failed: true,
    empty: false,
    disabled: false,
    'machine-follow-up': false,
};
function shouldTraceContextInjection(injection) {
    return injection.state === 'injected' || TRACED_ABSENCE_REASONS[injection.reason];
}
let InstanceContextService = class InstanceContextService {
    constructor(logger, activityEventRepository, executionRepository, workflowRepository, projectRepository, projectService) {
        this.logger = logger;
        this.activityEventRepository = activityEventRepository;
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.logger = this.logger.scoped('instance-ai');
    }
    async buildBlock(input) {
        if (!input.enabled)
            return { state: 'absent', reason: 'disabled' };
        if (input.isMachineFollowUp)
            return { state: 'absent', reason: 'machine-follow-up' };
        try {
            const now = input.now ?? new Date();
            const resolved = await this.resolveScope(input.user, input.scope);
            if (resolved === null)
                return { state: 'absent', reason: 'empty' };
            const projectIds = resolved.projectIds;
            const mcpVisibleOnly = resolved.surface === 'mcp';
            const cursor = input.cursor;
            const isUpdate = cursor !== null;
            const [entries, runs, inventory] = await Promise.all([
                this.readEntries({ cursor, now, scope: resolved }),
                resolved.surface === 'mcp' && !resolved.runsVisible
                    ? Promise.resolve([])
                    : this.readRuns({ projectIds, cursor, now, mcpVisibleOnly }),
                isUpdate
                    ? Promise.resolve(undefined)
                    : this.workflowRepository.findRecentForProjects(projectIds, inventorySize, {
                        mcpVisibleOnly,
                    }),
            ]);
            if (entries.rows.length === 0 && runs.length === 0 && !inventory?.total) {
                return { state: 'absent', reason: 'empty' };
            }
            return {
                state: 'injected',
                isUpdate,
                block: renderBlock({
                    surface: resolved.surface,
                    entries: entries.rows.map((row) => toFeedEntry(row, input.user.id, now)),
                    entriesTruncated: entries.truncated,
                    runs,
                    isUpdate,
                    inventory,
                    now,
                }),
                cursor: {
                    activityMark: entries.mark,
                    activityFloor: entries.floor,
                    activityCategories: resolved.allowedCategories,
                    activitySeen: entries.seen,
                    activitySeenFloor: entries.seenFloor,
                    runsThrough: now.toISOString(),
                },
                legs: {
                    inventory: inventory?.workflows.length ?? 0,
                    events: entries.rows.length,
                    runs: runs.length,
                },
            };
        }
        catch (error) {
            this.logger.warn('Failed to build the instance-context block', { error });
            if (input.scope.surface === 'mcp')
                throw error;
            return { state: 'absent', reason: 'failed' };
        }
    }
    async list(input) {
        return (await this.listPage(input)).entries;
    }
    async listPage(input) {
        const empty = { entries: [], hasMore: false };
        if (input.category !== undefined && !isKnownCategory(input.category))
            return empty;
        const resolved = await this.resolveScope(input.user, input.scope);
        if (resolved === null)
            return empty;
        const category = resolveCategory(input.category, resolved);
        if (category === null)
            return empty;
        const filtersWithheld = resolved.surface === 'mcp';
        const fetchLimit = filtersWithheld ? input.limit * withheldFetchMultiplier : input.limit;
        const rows = await this.activityEventRepository.findFeed({
            limit: fetchLimit,
            projectIds: resolved.projectIds,
            allowedCategories: resolved.allowedCategories,
            ...(category !== undefined ? { filterCategory: category } : {}),
            ...(input.resourceId !== undefined ? { resourceId: input.resourceId } : {}),
            ...(input.beforeId !== undefined ? { beforeId: input.beforeId } : {}),
        });
        const visible = filtersWithheld ? await this.withoutWithheldWorkflows(rows, resolved) : rows;
        if (input.resourceId !== undefined && rows.length > 0 && visible.length === 0) {
            return empty;
        }
        const hasMore = visible.length > input.limit || rows.length === fetchLimit;
        const shown = visible.slice(0, input.limit);
        const resumeFrom = shown.length === input.limit ? shown.at(-1)?.id : rows.at(-1)?.id;
        return {
            entries: shown.map((row) => toActivityEntry(row, input.user.id)),
            hasMore,
            ...(hasMore && resumeFrom !== undefined ? { nextBeforeId: resumeFrom } : {}),
        };
    }
    async expand(input) {
        const resolved = await this.resolveScope(input.user, input.scope);
        if (resolved === null)
            return null;
        const projectIds = resolved.projectIds;
        const row = await this.activityEventRepository.findEntry({
            id: input.id,
            projectIds,
            allowedCategories: resolved.allowedCategories,
        });
        if (!row)
            return null;
        if (resolved.surface === 'mcp') {
            const [visible] = await this.withoutWithheldWorkflows([row], resolved);
            if (!visible)
                return null;
        }
        const history = row.resourceType && row.resourceId
            ? await this.activityEventRepository.findByResource({
                resourceType: row.resourceType,
                resourceId: row.resourceId,
                projectIds,
                limit: resourceHistoryLimit,
            })
            : [];
        const hint = liveRecordHint(row, input.scope.surface);
        return {
            entry: toActivityEntry(row, input.user.id),
            resourceHistory: history
                .filter((other) => other.id !== row.id)
                .map((other) => toActivityEntry(other, input.user.id)),
            ...(hint ? { liveRecordHint: hint } : {}),
        };
    }
    async readEntries(input) {
        const fetchLimit = input.scope.surface === 'mcp' ? entryFetchLimit * withheldFetchMultiplier : entryFetchLimit;
        const arrivals = await this.activityEventRepository.findFeed({
            limit: fetchLimit,
            projectIds: input.scope.projectIds,
            allowedCategories: input.scope.allowedCategories,
            ...(input.cursor ? { afterId: input.cursor.activityMark } : {}),
        });
        const cursor = input.cursor;
        const band = cursor
            ? await this.activityEventRepository.findFeed({
                limit: seenIdsCap,
                projectIds: input.scope.projectIds,
                allowedCategories: input.scope.allowedCategories,
                afterId: Math.max(cursor.activityFloor, cursor.activitySeenFloor ?? 0),
                beforeId: cursor.activityMark,
            })
            : [];
        const addedCategories = input.scope.allowedCategories.filter((category) => cursor && !cursor.activityCategories.includes(category));
        const reopened = cursor && addedCategories.length > 0
            ? await this.activityEventRepository.findFeed({
                limit: seenIdsCap,
                projectIds: input.scope.projectIds,
                allowedCategories: addedCategories,
                afterId: cursor.activitySeenFloor ?? 0,
                beforeId: cursor.activityFloor + 1,
            })
            : [];
        const read = [...arrivals, ...band, ...reopened];
        const rows = input.scope.surface === 'mcp' ? await this.withoutWithheldWorkflows(read, input.scope) : read;
        const alreadyShown = new Set(cursor?.activitySeen ?? []);
        const fresh = rows.filter((row) => !alreadyShown.has(row.id) && input.now.getTime() - row.createdAt.getTime() <= maxAgeMs);
        const shown = fresh.slice(0, windowSize);
        const mark = read.reduce((highest, row) => Math.max(highest, row.id), cursor?.activityMark ?? 0);
        const cut = fresh[windowSize];
        const floor = Math.max(cursor?.activityFloor ?? 0, cut?.id ?? 0);
        const seen = [...alreadyShown, ...shown.map((row) => row.id)].sort((a, b) => b - a);
        const seenFloor = Math.max(cursor?.activitySeenFloor ?? 0, seen[seenIdsCap] ?? 0);
        return {
            rows: shown,
            mark,
            floor,
            seen: seen.filter((id) => id > seenFloor).slice(0, seenIdsCap),
            seenFloor,
            truncated: fresh.length > windowSize || arrivals.length === fetchLimit,
        };
    }
    async readRuns(input) {
        const windowMs = input.mcpVisibleOnly ? mcpRunWindowMs : maxAgeMs;
        const stoppedAfter = input.cursor
            ? new Date(Date.parse(input.cursor.runsThrough))
            : new Date(input.now.getTime() - windowMs);
        return await this.executionRepository.summariseRunsForProjects({
            projectIds: input.projectIds,
            stoppedAfter,
            stoppedBefore: input.now,
            workflowLimit: runWorkflowCap,
            ...(input.mcpVisibleOnly ? { mcpVisibleOnly: true } : {}),
        });
    }
    async resolveScope(user, scope) {
        if (scope.projectId !== undefined) {
            const projectId = scope.projectId;
            const allowed = await (0, check_access_1.userHasScopes)(user, ['workflow:read'], false, { projectId });
            if (!allowed)
                return null;
            if (scope.surface === 'conversation') {
                const credentials = await (0, check_access_1.userHasScopes)(user, ['credential:read'], false, { projectId });
                return {
                    surface: 'conversation',
                    projectIds: [projectId],
                    allowedCategories: credentials ? ['workflow', 'credential'] : ['workflow'],
                };
            }
            const credentialProjectIds = scope.credentialGranted
                ? await this.credentialReadableProjectIds(user, [projectId], (await this.projectRepository.getPersonalProjectForUser(user.id))?.id)
                : [];
            return {
                surface: 'mcp',
                projectIds: [projectId],
                credentialProjectIds,
                allowedCategories: hasCredentialProjectScope(credentialProjectIds)
                    ? ['workflow', 'credential']
                    : ['workflow'],
                runsVisible: scope.executionGranted,
            };
        }
        if (scope.surface === 'conversation')
            return null;
        if ((0, permissions_1.hasGlobalScope)(user, ['workflow:read'], { mode: 'allOf' })) {
            const credentialProjectIds = !scope.credentialGranted
                ? []
                : (0, permissions_1.hasGlobalScope)(user, ['credential:read'], { mode: 'allOf' })
                    ? 'all-projects'
                    : await this.credentialReadableProjectIds(user, null, undefined);
            return {
                surface: 'mcp',
                projectIds: 'all-projects',
                credentialProjectIds,
                allowedCategories: hasCredentialProjectScope(credentialProjectIds)
                    ? ['workflow', 'credential']
                    : ['workflow'],
                runsVisible: scope.executionGranted,
            };
        }
        const [scopedIds, personalProject] = await Promise.all([
            this.projectService.getProjectIdsWithScope(user, ['workflow:read']),
            this.projectRepository.getPersonalProjectForUser(user.id),
        ]);
        const projectIds = personalProject
            ? [...new Set([...scopedIds, personalProject.id])]
            : scopedIds;
        if (projectIds.length === 0)
            return null;
        const credentialProjectIds = scope.credentialGranted
            ? await this.credentialReadableProjectIds(user, projectIds, personalProject?.id)
            : [];
        return {
            surface: 'mcp',
            projectIds,
            credentialProjectIds,
            allowedCategories: hasCredentialProjectScope(credentialProjectIds)
                ? ['workflow', 'credential']
                : ['workflow'],
            runsVisible: scope.executionGranted,
        };
    }
    async credentialReadableProjectIds(user, projectIds, personalProjectId) {
        if (projectIds !== null && projectIds.length === 0)
            return [];
        const readable = await this.projectService.getProjectIdsWithScope(user, ['credential:read'], projectIds ?? undefined);
        const readableSet = new Set(readable);
        if (personalProjectId)
            readableSet.add(personalProjectId);
        if (projectIds === null)
            return [...readableSet];
        return projectIds.filter((projectId) => readableSet.has(projectId));
    }
    async hasWithheldWorkflows(user, scope) {
        const resolved = await this.resolveScope(user, scope);
        if (resolved === null)
            return false;
        const { total } = await this.workflowRepository.findRecentForProjects(resolved.projectIds, 1, {
            mcpVisibleOnly: false,
        });
        return total > 0;
    }
    async withoutWithheldWorkflows(rows, scope) {
        rows = rows.filter((row) => isCredentialVisible(row, scope));
        const workflowIds = [
            ...new Set(rows.flatMap((row) => row.resourceType === 'workflow' && row.resourceId ? [row.resourceId] : [])),
        ];
        if (workflowIds.length === 0)
            return rows;
        const availability = await this.workflowRepository.findMcpAvailabilityByIds(workflowIds);
        return rows.filter((row) => {
            if (row.resourceType !== 'workflow' || !row.resourceId)
                return true;
            const available = availability.get(row.resourceId);
            if (available === undefined)
                return row.action === 'deleted';
            return available;
        });
    }
};
exports.InstanceContextService = InstanceContextService;
exports.InstanceContextService = InstanceContextService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.ActivityEventRepository, db_1.ExecutionRepository, db_1.WorkflowRepository, db_1.ProjectRepository, project_service_ee_1.ProjectService])
], InstanceContextService);
function hasCredentialProjectScope(projectIds) {
    return projectIds === 'all-projects' || projectIds.length > 0;
}
function resolveCategory(requested, scope) {
    const category = isKnownCategory(requested) ? requested : undefined;
    if (category !== undefined && !scope.allowedCategories.includes(category))
        return null;
    if (scope.surface !== 'mcp')
        return category;
    if (hasCredentialProjectScope(scope.credentialProjectIds))
        return category;
    if (category === 'credential')
        return null;
    return category ?? 'workflow';
}
function isCredentialVisible(row, scope) {
    if (scope.surface !== 'mcp')
        return true;
    if (row.category !== 'credential' && row.resourceType !== 'credential')
        return true;
    if (scope.credentialProjectIds === 'all-projects')
        return true;
    return scope.credentialProjectIds.includes(row.projectId);
}
const toolNames = {
    conversation: {
        expand: '`activity(action="expand", id=N)`',
        list: '`activity(action="list")`',
        workflows: '`workflow_builder_workflows(action="list")`',
    },
    mcp: {
        expand: '`expand_instance_activity(id=N)`',
        list: '`get_instance_activity`',
        workflows: '`search_workflows`',
    },
};
const initialPreamble = (tools) => [
    'What is going on in this instance. This is work that already exists and that you can pick up:',
    'when the user is vague ("fix it", "carry on", "what should I look at"), the answer is usually',
    'the most recent thing here, and often the most recent failure. Name what you think they mean',
    'and act on it rather than asking them to choose from a list they can already see.',
    'Do not narrate this back to them — unless they asked what has been happening, let it change',
    'what you do rather than what you say.',
    `Call ${tools.expand} to read an entry and its resource history.`,
    `Use ${tools.list} to look further back. An entry may name a resource that no longer exists.`,
];
const updatePreamble = (tools) => [
    'What has happened since the list earlier in this conversation. Those earlier entries still',
    'stand — these are additions, not a replacement. Read them the same way: context on what the',
    'user has been doing, not a task list or something to comment on unprompted.',
    `Use ${tools.expand} for details or ${tools.list} for older entries.`,
];
function renderInventory(inventory, tools, surface) {
    if (inventory.total === 0) {
        return surface === 'mcp'
            ? ['No workflows here are exposed to MCP, so none can be named.', '']
            : ['Nothing has been built here yet.', ''];
    }
    const named = inventory.workflows.map((workflow) => `  - "${sanitiseForBlock(workflow.name)}" (workflow:${workflow.id})${workflow.active ? ' [published]' : ''}`);
    const more = inventory.total - inventory.workflows.length;
    return [
        `Workflows that already exist here: ${inventory.total}. Most recently worked on:`,
        ...named,
        ...(more > 0 ? [`  ... and ${more} more — ${tools.workflows} for the rest.`] : []),
        '',
    ];
}
function renderRuns(runs, isUpdate, now) {
    if (runs.length === 0)
        return [];
    const lines = runs.map((run) => {
        const outcome = run.failed === 0
            ? `ran ${run.total}×, all succeeded`
            : `ran ${run.total}×, ${run.failed} failed`;
        const failure = run.lastFailedExecutionId
            ? `last failure execution:${run.lastFailedExecutionId}`
            : '';
        return `  - ${[
            `"${sanitiseForBlock(run.workflowName)}" (workflow:${run.workflowId})`,
            outcome,
            failure,
            formatAge(run.lastStoppedAt, now),
        ]
            .filter(Boolean)
            .join(' · ')}`;
    });
    return [isUpdate ? 'Runs since then:' : 'Recent runs:', ...lines, ''];
}
function renderBlock(input) {
    const tools = toolNames[input.surface];
    const prose = [
        ...(input.isUpdate ? updatePreamble(tools) : initialPreamble(tools)),
        '',
        ...(input.inventory ? renderInventory(input.inventory, tools, input.surface) : []),
        ...renderRuns(input.runs, input.isUpdate, input.now),
        ...(input.entries.length > 0
            ? [
                input.isUpdate ? 'Changes since then:' : 'What changed recently:',
                ...input.entries,
                ...(input.entriesTruncated
                    ? [`  ... and more than these — ${tools.list} for the rest.`]
                    : []),
            ]
            : []),
    ].join('\n');
    return input.surface === 'mcp'
        ? prose
        : `${internal_messages_1.INSTANCE_CONTEXT_OPEN_TAG}\n${prose}\n${internal_messages_1.INSTANCE_CONTEXT_CLOSE_TAG}`;
}
const knownCategories = new Set(db_1.activityEventCategories);
function isKnownCategory(category) {
    return category !== undefined && knownCategories.has(category);
}
function toActivityEntry(row, currentUserId) {
    return {
        id: row.id,
        at: row.createdAt.toISOString(),
        category: row.category,
        action: row.action,
        byCurrentUser: row.userId === currentUserId,
        ...(row.resourceType ? { resourceType: row.resourceType } : {}),
        ...(row.resourceId ? { resourceId: row.resourceId } : {}),
        ...(row.resourceName ? { resourceName: row.resourceName } : {}),
        ...(row.data ? { detail: row.data } : {}),
    };
}
function liveRecordHint(row, surface) {
    const hints = {
        conversation: {
            workflow: row.resourceId
                ? `workflow_builder_workflows(action="get", workflowId="${row.resourceId}")`
                : undefined,
            credential: 'workflow_builder_credentials(action="list")',
        },
        mcp: {
            workflow: row.resourceId ? `get_workflow_details(workflowId="${row.resourceId}")` : undefined,
            credential: 'list_credentials()',
        },
    };
    return row.resourceType ? hints[surface][row.resourceType] : undefined;
}
function toFeedEntry(row, currentUserId, now) {
    return [
        `[id:${row.id}]`,
        formatAge(row.createdAt, now),
        row.category,
        row.action,
        formatResource(row),
        formatDetail(row),
        row.userId && row.userId !== currentUserId ? 'by another user' : '',
    ]
        .filter(Boolean)
        .join(' · ');
}
const blockValueMaxLength = 128;
function sanitiseForBlock(value) {
    const printable = Array.from(value)
        .map((character) => {
        const code = character.codePointAt(0) ?? 0;
        return code < 0x20 || code === 0x7f ? ' ' : character;
    })
        .join('');
    return printable
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, blockValueMaxLength);
}
function formatResource(row) {
    if (!row.resourceId)
        return '';
    const name = row.resourceName ? `"${sanitiseForBlock(row.resourceName)}" ` : '';
    return `${name}(${row.resourceType ?? 'resource'}:${row.resourceId})`;
}
function formatDetail(row) {
    const data = row.data ?? {};
    if (data.truncated === true)
        return 'detail too large — expand it';
    const clauses = [nodeChange(data), provenanceClause(data), versionClause(data)].filter(Boolean);
    return clauses.slice(0, 2).join(' · ');
}
function nodeChange(data) {
    const added = readStringList(data, 'nodesAdded');
    const removed = readStringList(data, 'nodesRemoved');
    const addedTotal = readNumber(data, 'nodesAddedTotal') ?? added.length;
    const removedTotal = readNumber(data, 'nodesRemovedTotal') ?? removed.length;
    const parts = [
        ...(addedTotal > 0
            ? [`+${addedTotal}${added.length ? ` ${sanitiseForBlock(added.join(', '))}` : ''}`]
            : []),
        ...(removedTotal > 0
            ? [`−${removedTotal}${removed.length ? ` ${sanitiseForBlock(removed.join(', '))}` : ''}`]
            : []),
    ];
    if (parts.length > 0)
        return parts.join(', ');
    const nodeCount = readNumber(data, 'nodeCount');
    return nodeCount === undefined ? '' : `${nodeCount} nodes`;
}
function provenanceClause(data) {
    const source = readString(data, 'source');
    if (source === 'n8n-ai')
        return 'by the assistant';
    if (source === 'api' || source === 'n8n-mcp')
        return `via ${source}`;
    if (source === 'import')
        return 'imported';
    return '';
}
function versionClause(data) {
    const versionName = readString(data, 'versionName');
    if (versionName)
        return `version "${sanitiseForBlock(versionName)}"`;
    const credentialType = readString(data, 'credentialType');
    return credentialType ? sanitiseForBlock(credentialType) : '';
}
function formatAge(at, now) {
    const elapsed = Math.max(0, now.getTime() - at.getTime());
    if (elapsed < constants_1.Time.hours.toMilliseconds) {
        return `${Math.max(1, Math.floor(elapsed / constants_1.Time.minutes.toMilliseconds))}m ago`;
    }
    if (elapsed < constants_1.Time.days.toMilliseconds) {
        return `${Math.floor(elapsed / constants_1.Time.hours.toMilliseconds)}h ago`;
    }
    return `${Math.floor(elapsed / constants_1.Time.days.toMilliseconds)}d ago`;
}
function readString(data, key) {
    const value = data[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
function readStringList(data, key) {
    const value = data[key];
    if (!Array.isArray(value))
        return [];
    const items = value;
    return items.filter((item) => typeof item === 'string');
}
function readNumber(data, key) {
    const value = data[key];
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}
//# sourceMappingURL=instance-context.service.js.map