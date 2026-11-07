"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeLinearContextQuery = executeLinearContextQuery;
exports.executeLinearAction = executeLinearAction;
exports.normalizeLinearIssue = normalizeLinearIssue;
exports.normalizeLinearComment = normalizeLinearComment;
const zod_1 = require("zod");
const is_record_1 = require("@n8n/utils/is-record");
const integration_error_codes_1 = require("../integration-error-codes");
const integration_helpers_1 = require("../integration-helpers");
const PLATFORM = 'linear';
const getUserSchema = zod_1.z.object({ userId: zod_1.z.string().min(1) });
const searchUsersSchema = zod_1.z
    .object({
    query: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    includeBots: zod_1.z.boolean().default(false),
    includeDeleted: zod_1.z.boolean().default(false),
})
    .refine((input) => input.query !== undefined || input.email !== undefined, {
    message: 'Provide query or email.',
});
const getIssueSchema = zod_1.z.object({
    issueId: zod_1.z.string().min(1),
    includeComments: zod_1.z.boolean().default(false),
    commentsLimit: zod_1.z.number().int().min(1).max(20).default(10),
});
const searchIssuesSchema = zod_1.z.object({
    query: zod_1.z.string().min(1),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    teamId: zod_1.z.string().min(1).optional(),
    includeArchived: zod_1.z.boolean().default(false),
});
const getTeamSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
});
const searchTeamsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    includeArchived: zod_1.z.boolean().default(false),
});
const getProjectSchema = zod_1.z.object({
    projectId: zod_1.z.string().min(1),
});
const searchProjectsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    teamId: zod_1.z.string().min(1).optional(),
    includeArchived: zod_1.z.boolean().default(false),
});
const searchLabelsSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    teamId: zod_1.z.string().min(1).optional(),
});
const searchIssueStatesSchema = zod_1.z.object({
    query: zod_1.z.string().min(1).optional(),
    limit: zod_1.z.number().int().min(1).max(50).default(10),
    cursor: zod_1.z.string().min(1).optional(),
    teamId: zod_1.z.string().min(1).optional(),
    type: zod_1.z.enum(['backlog', 'unstarted', 'started', 'completed', 'canceled']).optional(),
});
const createIssueSchema = zod_1.z.object({
    teamId: zod_1.z.string().min(1),
    title: zod_1.z.string().min(1),
    description: zod_1.z.string().min(1).optional(),
    assigneeId: zod_1.z.string().min(1).optional(),
    projectId: zod_1.z.string().min(1).optional(),
    labelIds: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    priority: zod_1.z.number().int().optional(),
    stateId: zod_1.z.string().min(1).optional(),
    parentId: zod_1.z.string().min(1).optional(),
});
const nullableLinearIdSchema = zod_1.z.string().min(1).nullable();
const updateIssueSchema = zod_1.z
    .object({
    issueId: zod_1.z.string().min(1),
    teamId: nullableLinearIdSchema.optional(),
    title: zod_1.z.string().min(1).optional(),
    description: zod_1.z.string().min(1).nullable().optional(),
    assigneeId: nullableLinearIdSchema.optional(),
    projectId: nullableLinearIdSchema.optional(),
    labelIds: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    priority: zod_1.z.number().int().nullable().optional(),
    stateId: nullableLinearIdSchema.optional(),
    parentId: nullableLinearIdSchema.optional(),
})
    .refine(integration_helpers_1.hasUpdateIssueField, {
    message: 'Provide at least one issue field to update.',
});
const createCommentSchema = zod_1.z.object({
    issueId: zod_1.z.string().min(1),
    body: zod_1.z.string().min(1),
    parentCommentId: zod_1.z.string().min(1).optional(),
});
async function executeLinearContextQuery(params) {
    const adapter = getLinearAdapter(params.chat);
    if (!adapter)
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, params.query);
    if (params.query === 'get_user') {
        return await getLinearUser(adapter, getUserSchema.parse(params.input));
    }
    if (params.query === 'search_users') {
        return await searchLinearUsers(adapter, searchUsersSchema.parse(params.input));
    }
    if (params.query === 'get_team') {
        return await getLinearTeam(adapter, getTeamSchema.parse(params.input));
    }
    if (params.query === 'search_teams') {
        return await searchLinearTeams(adapter, searchTeamsSchema.parse(params.input));
    }
    if (params.query === 'get_project') {
        return await getLinearProject(adapter, getProjectSchema.parse(params.input));
    }
    if (params.query === 'search_projects') {
        return await searchLinearProjects(adapter, searchProjectsSchema.parse(params.input));
    }
    if (params.query === 'search_labels') {
        return await searchLinearLabels(adapter, searchLabelsSchema.parse(params.input));
    }
    if (params.query === 'search_issue_states') {
        return await searchLinearIssueStates(adapter, searchIssueStatesSchema.parse(params.input));
    }
    if (params.query === 'get_issue') {
        return await getLinearIssue(adapter, getIssueSchema.parse(params.input));
    }
    if (params.query === 'search_issues') {
        return await searchLinearIssues(adapter, searchIssuesSchema.parse(params.input));
    }
    return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, params.query);
}
async function executeLinearAction(params) {
    if (params.action === 'create_issue') {
        return await createLinearIssue(params.chat, params.descriptor, createIssueSchema.parse(params.input));
    }
    if (params.action === 'update_issue') {
        return await updateLinearIssue(params.chat, params.descriptor, updateIssueSchema.parse(params.input));
    }
    if (params.action === 'create_comment') {
        return await createLinearComment(params.chat, params.descriptor, createCommentSchema.parse(params.input));
    }
    return undefined;
}
async function getLinearUser(adapter, input) {
    if (!hasMethod(adapter.client, 'user')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'get_user');
    }
    const user = await adapter.client.user(input.userId);
    return { ok: true, user: normalizeLinearUser(user) ?? null };
}
async function searchLinearUsers(adapter, input) {
    if (!hasMethod(adapter.client, 'users')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_users');
    }
    const response = await adapter.client.users({
        filter: buildLinearUserSearchFilter(input),
        first: input.limit,
        ...(input.cursor ? { after: input.cursor } : {}),
        includeArchived: input.includeDeleted,
        includeDisabled: input.includeDeleted,
    });
    const users = linearNodes(response).map(normalizeLinearUser).filter(integration_helpers_1.isDefined);
    const nextCursor = extractLinearNextCursor(response);
    return {
        ok: true,
        users,
        resultCount: users.length,
        ...(nextCursor ? { nextCursor } : {}),
    };
}
async function getLinearTeam(adapter, input) {
    if (!hasMethod(adapter.client, 'team')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'get_team');
    }
    const team = await adapter.client.team(input.teamId);
    return { ok: true, team: normalizeLinearTeam(team) ?? null };
}
async function searchLinearTeams(adapter, input) {
    if (!hasMethod(adapter.client, 'teams')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_teams');
    }
    const response = await adapter.client.teams(buildLinearConnectionOptions(input, { includeArchived: true }));
    const teams = filterLinearRecords(linearNodes(response).map(normalizeLinearTeam).filter(integration_helpers_1.isDefined), input.query, ['teamId', 'key', 'name', 'description', 'url']);
    return linearSearchResult('teams', teams, response);
}
async function getLinearProject(adapter, input) {
    if (!hasMethod(adapter.client, 'project')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'get_project');
    }
    const project = await adapter.client.project(input.projectId);
    return { ok: true, project: normalizeLinearProject(project) ?? null };
}
async function searchLinearProjects(adapter, input) {
    const options = buildLinearConnectionOptions(input, { includeArchived: true });
    const response = input.teamId
        ? await callLinearTeamConnection(adapter, input.teamId, ['projects'], options)
        : await callLinearProjectSearch(adapter, input, options);
    if (!response)
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_projects');
    const projects = filterLinearRecords(linearNodes(response).map(normalizeLinearProject).filter(integration_helpers_1.isDefined), input.query, ['projectId', 'name', 'description', 'url', 'state']);
    return linearSearchResult('projects', projects, response);
}
async function searchLinearLabels(adapter, input) {
    const options = buildLinearConnectionOptions(input);
    const response = input.teamId
        ? await callLinearTeamConnection(adapter, input.teamId, ['labels'], options)
        : await callLinearIssueLabels(adapter, options);
    if (!response)
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_labels');
    const labels = filterLinearRecords(linearNodes(response).map(normalizeLinearLabel).filter(integration_helpers_1.isDefined), input.query, ['labelId', 'name', 'description', 'color']);
    return linearSearchResult('labels', labels, response);
}
async function searchLinearIssueStates(adapter, input) {
    const options = buildLinearConnectionOptions(input);
    const response = input.teamId
        ? await callLinearTeamConnection(adapter, input.teamId, ['states', 'workflowStates'], options)
        : await callLinearWorkflowStates(adapter, options);
    if (!response)
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_issue_states');
    const states = filterLinearIssueStates(linearNodes(response).map(normalizeLinearWorkflowState).filter(integration_helpers_1.isDefined), input);
    return linearSearchResult('states', states, response);
}
async function getLinearIssue(adapter, input) {
    if (!hasMethod(adapter.client, 'issue')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'get_issue');
    }
    const issue = await adapter.client.issue(input.issueId);
    if (!issue)
        return { ok: true, issue: null };
    return {
        ok: true,
        issue: await normalizeLinearIssue(issue, {
            includeComments: input.includeComments,
            commentsLimit: input.commentsLimit,
        }),
    };
}
async function searchLinearIssues(adapter, input) {
    if (!hasMethod(adapter.client, 'searchIssues')) {
        return (0, integration_helpers_1.unsupportedQuery)(PLATFORM, 'search_issues');
    }
    const response = await adapter.client.searchIssues(input.query, {
        first: input.limit,
        ...(input.cursor ? { after: input.cursor } : {}),
        ...(input.teamId ? { teamId: input.teamId } : {}),
        includeArchived: input.includeArchived,
    });
    const issues = linearNodes(response).map(summarizeLinearIssue);
    const totalCount = (0, integration_helpers_1.numberProperty)(response, 'totalCount');
    const nextCursor = extractLinearNextCursor(response);
    return {
        ok: true,
        issues,
        resultCount: issues.length,
        ...(totalCount !== undefined ? { totalCount } : {}),
        ...(nextCursor ? { nextCursor } : {}),
    };
}
function extractLinearNextCursor(response) {
    if (!(0, is_record_1.isRecord)(response))
        return undefined;
    const pageInfo = response.pageInfo;
    if (!(0, is_record_1.isRecord)(pageInfo))
        return undefined;
    if (pageInfo.hasNextPage !== true)
        return undefined;
    return (0, integration_helpers_1.stringProperty)(pageInfo, 'endCursor');
}
function buildLinearConnectionOptions(input, options = {}) {
    return (0, integration_helpers_1.removeUndefinedValues)({
        first: input.limit,
        ...(input.cursor ? { after: input.cursor } : {}),
        ...(options.includeArchived ? { includeArchived: input.includeArchived ?? false } : {}),
    });
}
async function callLinearProjectSearch(adapter, input, options) {
    if (input.query && hasMethod(adapter.client, 'searchProjects')) {
        return await adapter.client.searchProjects(input.query, options);
    }
    if (hasMethod(adapter.client, 'projects')) {
        return await adapter.client.projects(options);
    }
    return undefined;
}
async function callLinearIssueLabels(adapter, options) {
    if (!hasMethod(adapter.client, 'issueLabels'))
        return undefined;
    return await adapter.client.issueLabels(options);
}
async function callLinearWorkflowStates(adapter, options) {
    if (!hasMethod(adapter.client, 'workflowStates'))
        return undefined;
    return await adapter.client.workflowStates(options);
}
async function callLinearTeamConnection(adapter, teamId, keys, options) {
    if (!hasMethod(adapter.client, 'team'))
        return undefined;
    const team = await adapter.client.team(teamId);
    if (!(0, is_record_1.isRecord)(team))
        return undefined;
    for (const key of keys) {
        const response = await callLinearConnection(team, key, options);
        if (response !== undefined)
            return response;
    }
    return undefined;
}
function linearSearchResult(key, records, response) {
    const nextCursor = extractLinearNextCursor(response);
    const totalCount = (0, integration_helpers_1.numberProperty)(response, 'totalCount');
    return {
        ok: true,
        [key]: records,
        resultCount: records.length,
        ...(totalCount !== undefined ? { totalCount } : {}),
        ...(nextCursor ? { nextCursor } : {}),
    };
}
function filterLinearRecords(records, query, keys) {
    const term = query?.trim().toLowerCase();
    if (!term)
        return records;
    return records.filter((record) => keys.some((key) => {
        const value = (0, integration_helpers_1.stringProperty)(record, key);
        return value !== undefined && value.toLowerCase().includes(term);
    }));
}
function filterLinearIssueStates(states, input) {
    const queryFilteredStates = filterLinearRecords(states, input.query, [
        'stateId',
        'name',
        'type',
        'color',
    ]);
    if (!input.type)
        return queryFilteredStates;
    return queryFilteredStates.filter((state) => (0, integration_helpers_1.stringProperty)(state, 'type') === input.type);
}
async function createLinearIssue(chat, descriptor, input) {
    const adapter = getLinearAdapter(chat);
    if (!adapter || !hasMethod(adapter.client, 'createIssue')) {
        return (0, integration_helpers_1.unsupportedAction)(PLATFORM, 'create_issue');
    }
    const payload = await adapter.client.createIssue((0, integration_helpers_1.removeUndefinedValues)({ ...input }));
    const rawIssue = await awaitableProperty(payload, 'issue');
    const normalizedIssue = await normalizeLinearIssue(rawIssue ?? payload);
    const issueId = (0, integration_helpers_1.stringProperty)(normalizedIssue, 'issueId') ??
        (0, integration_helpers_1.stringProperty)(payload, 'issueId') ??
        (0, integration_helpers_1.stringProperty)(normalizedIssue, 'identifier');
    if (!issueId) {
        return (0, integration_helpers_1.integrationError)(integration_error_codes_1.INTEGRATION_ERROR_CODES.ACTION_FAILED, 'Linear did not return an issue ID for the created issue.');
    }
    return {
        ok: true,
        issue: normalizedIssue,
        messageContext: {
            integrationConnectionId: descriptor.integrationConnectionId,
            platform: descriptor.integration.type,
            target: { type: 'thread', threadId: `linear:${issueId}` },
            subject: buildLinearIssueSubject(normalizedIssue, issueId),
            updatedAt: new Date().toISOString(),
        },
    };
}
async function updateLinearIssue(chat, descriptor, input) {
    const adapter = getLinearAdapter(chat);
    if (!adapter || !hasMethod(adapter.client, 'updateIssue')) {
        return (0, integration_helpers_1.unsupportedAction)(PLATFORM, 'update_issue');
    }
    const payload = await adapter.client.updateIssue(input.issueId, buildLinearIssueUpdatePayload(input));
    const rawIssue = await awaitableProperty(payload, 'issue');
    const normalizedIssue = await normalizeLinearIssue(rawIssue ?? payload);
    const issueId = (0, integration_helpers_1.stringProperty)(normalizedIssue, 'issueId') ?? input.issueId;
    return {
        ok: true,
        issue: normalizedIssue,
        messageContext: {
            integrationConnectionId: descriptor.integrationConnectionId,
            platform: descriptor.integration.type,
            target: { type: 'thread', threadId: `linear:${issueId}` },
            subject: buildLinearIssueSubject(normalizedIssue, issueId),
            updatedAt: new Date().toISOString(),
        },
    };
}
async function createLinearComment(chat, descriptor, input) {
    const adapter = getLinearAdapter(chat);
    if (!adapter || !hasMethod(adapter.client, 'createComment')) {
        return (0, integration_helpers_1.unsupportedAction)(PLATFORM, 'create_comment');
    }
    const payload = await adapter.client.createComment((0, integration_helpers_1.removeUndefinedValues)({
        issueId: input.issueId,
        body: input.body,
        parentId: input.parentCommentId,
    }));
    const rawComment = await awaitableProperty(payload, 'comment');
    const normalizedComment = await normalizeLinearComment(rawComment ?? payload);
    const commentId = (0, integration_helpers_1.stringProperty)(normalizedComment, 'commentId') ?? (0, integration_helpers_1.stringProperty)(payload, 'commentId');
    return {
        ok: true,
        comment: normalizedComment,
        messageContext: {
            integrationConnectionId: descriptor.integrationConnectionId,
            platform: descriptor.integration.type,
            target: {
                type: 'thread',
                threadId: input.parentCommentId
                    ? `linear:${input.issueId}:c:${input.parentCommentId}`
                    : `linear:${input.issueId}`,
            },
            ...(commentId ? { messageId: commentId } : {}),
            subject: { type: 'issue', id: input.issueId },
            updatedAt: new Date().toISOString(),
        },
    };
}
function buildLinearIssueUpdatePayload(input) {
    return (0, integration_helpers_1.removeUndefinedValues)({
        teamId: input.teamId,
        title: input.title,
        description: input.description,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        labelIds: input.labelIds,
        priority: input.priority,
        stateId: input.stateId,
        parentId: input.parentId,
    });
}
function getLinearAdapter(chat) {
    const adapter = chat.getAdapter('linear');
    if (!(0, is_record_1.isRecord)(adapter) || !(0, is_record_1.isRecord)(adapter.client))
        return undefined;
    return { client: adapter.client };
}
function hasMethod(client, key) {
    return typeof client[key] === 'function';
}
function buildLinearUserSearchFilter(input) {
    const term = buildLinearUserSearchTermFilter(input);
    if (input.includeBots)
        return term;
    return { and: [term, { app: { eq: false } }] };
}
function buildLinearUserSearchTermFilter(input) {
    if (input.email) {
        return { email: { eqIgnoreCase: input.email.trim() } };
    }
    const query = input.query?.trim() ?? '';
    return {
        or: [
            { name: { containsIgnoreCase: query } },
            { displayName: { containsIgnoreCase: query } },
            { email: { containsIgnoreCase: query } },
        ],
    };
}
async function normalizeLinearIssue(value, options = {}) {
    const issue = (0, is_record_1.isRecord)(value) ? value : {};
    const [state, assignee, creator, team, project, labelsConnection] = await Promise.all([
        awaitableProperty(issue, 'state'),
        awaitableProperty(issue, 'assignee'),
        awaitableProperty(issue, 'creator'),
        awaitableProperty(issue, 'team'),
        awaitableProperty(issue, 'project'),
        callLinearConnection(issue, 'labels', { first: 50 }),
    ]);
    const priority = normalizeLinearPriority(issue);
    const comments = options.includeComments
        ? await normalizeLinearComments(issue, options.commentsLimit ?? 10)
        : undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        issueId: (0, integration_helpers_1.stringProperty)(issue, 'id'),
        identifier: (0, integration_helpers_1.stringProperty)(issue, 'identifier'),
        title: (0, integration_helpers_1.stringProperty)(issue, 'title'),
        description: (0, integration_helpers_1.stringProperty)(issue, 'description'),
        url: (0, integration_helpers_1.stringProperty)(issue, 'url'),
        priority,
        state: normalizeLinearState(state),
        assignee: normalizeLinearUser(assignee),
        creator: normalizeLinearUser(creator),
        team: normalizeLinearTeam(team),
        project: normalizeLinearProject(project),
        labels: linearNodes(labelsConnection).map(normalizeLinearLabel).filter(integration_helpers_1.isDefined),
        createdAt: (0, integration_helpers_1.isoDateProperty)(issue, 'createdAt'),
        updatedAt: (0, integration_helpers_1.isoDateProperty)(issue, 'updatedAt'),
        ...(comments ? { comments } : {}),
    });
}
function summarizeLinearIssue(value) {
    const issue = (0, is_record_1.isRecord)(value) ? value : {};
    return (0, integration_helpers_1.removeUndefinedValues)({
        issueId: (0, integration_helpers_1.stringProperty)(issue, 'id'),
        identifier: (0, integration_helpers_1.stringProperty)(issue, 'identifier'),
        title: (0, integration_helpers_1.stringProperty)(issue, 'title'),
        url: (0, integration_helpers_1.stringProperty)(issue, 'url'),
        priority: normalizeLinearPriority(issue),
        createdAt: (0, integration_helpers_1.isoDateProperty)(issue, 'createdAt'),
        updatedAt: (0, integration_helpers_1.isoDateProperty)(issue, 'updatedAt'),
    });
}
async function normalizeLinearComments(issue, commentsLimit) {
    const commentsConnection = await callLinearConnection(issue, 'comments', {
        first: commentsLimit,
    });
    if (!commentsConnection)
        return undefined;
    return await Promise.all(linearNodes(commentsConnection).map(async (comment) => await normalizeLinearComment(comment)));
}
async function normalizeLinearComment(value) {
    const comment = (0, is_record_1.isRecord)(value) ? value : {};
    const author = await awaitableProperty(comment, 'user');
    return (0, integration_helpers_1.removeUndefinedValues)({
        commentId: (0, integration_helpers_1.stringProperty)(comment, 'id'),
        body: (0, integration_helpers_1.stringProperty)(comment, 'body'),
        url: (0, integration_helpers_1.stringProperty)(comment, 'url'),
        createdAt: (0, integration_helpers_1.isoDateProperty)(comment, 'createdAt'),
        updatedAt: (0, integration_helpers_1.isoDateProperty)(comment, 'updatedAt'),
        author: normalizeLinearUser(author),
    });
}
function normalizeLinearUser(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const userId = (0, integration_helpers_1.stringProperty)(value, 'id');
    if (!userId)
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        userId,
        name: (0, integration_helpers_1.stringProperty)(value, 'name') ?? userId,
        displayName: (0, integration_helpers_1.stringProperty)(value, 'displayName'),
        email: (0, integration_helpers_1.stringProperty)(value, 'email'),
        avatarUrl: (0, integration_helpers_1.stringProperty)(value, 'avatarUrl'),
        active: (0, integration_helpers_1.booleanProperty)(value, 'active'),
        isBot: (0, integration_helpers_1.booleanProperty)(value, 'app') ?? false,
        isAssignable: (0, integration_helpers_1.booleanProperty)(value, 'isAssignable'),
        isMentionable: (0, integration_helpers_1.booleanProperty)(value, 'isMentionable'),
        url: (0, integration_helpers_1.stringProperty)(value, 'url'),
    });
}
function normalizeLinearState(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        id: (0, integration_helpers_1.stringProperty)(value, 'id'),
        name: (0, integration_helpers_1.stringProperty)(value, 'name'),
        type: (0, integration_helpers_1.stringProperty)(value, 'type'),
    });
}
function normalizeLinearTeam(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        teamId: (0, integration_helpers_1.stringProperty)(value, 'id'),
        key: (0, integration_helpers_1.stringProperty)(value, 'key'),
        name: (0, integration_helpers_1.stringProperty)(value, 'name'),
        description: (0, integration_helpers_1.stringProperty)(value, 'description'),
        url: (0, integration_helpers_1.stringProperty)(value, 'url'),
        isPrivate: (0, integration_helpers_1.booleanProperty)(value, 'private'),
        isArchived: (0, integration_helpers_1.booleanProperty)(value, 'archived') ??
            ((0, integration_helpers_1.stringProperty)(value, 'archivedAt') ? true : undefined),
    });
}
function normalizeLinearProject(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        projectId: (0, integration_helpers_1.stringProperty)(value, 'id'),
        name: (0, integration_helpers_1.stringProperty)(value, 'name'),
        description: (0, integration_helpers_1.stringProperty)(value, 'description'),
        url: (0, integration_helpers_1.stringProperty)(value, 'url'),
        state: (0, integration_helpers_1.stringProperty)(value, 'state'),
        color: (0, integration_helpers_1.stringProperty)(value, 'color'),
    });
}
function normalizeLinearLabel(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const labelId = (0, integration_helpers_1.stringProperty)(value, 'id');
    const name = (0, integration_helpers_1.stringProperty)(value, 'name');
    if (!labelId || !name)
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        labelId,
        name,
        color: (0, integration_helpers_1.stringProperty)(value, 'color'),
        description: (0, integration_helpers_1.stringProperty)(value, 'description'),
    });
}
function normalizeLinearWorkflowState(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const stateId = (0, integration_helpers_1.stringProperty)(value, 'id');
    if (!stateId)
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({
        stateId,
        name: (0, integration_helpers_1.stringProperty)(value, 'name'),
        type: (0, integration_helpers_1.stringProperty)(value, 'type'),
        color: (0, integration_helpers_1.stringProperty)(value, 'color'),
        position: (0, integration_helpers_1.numberProperty)(value, 'position'),
    });
}
function normalizeLinearPriority(issue) {
    const value = (0, integration_helpers_1.numberProperty)(issue, 'priority');
    const label = (0, integration_helpers_1.stringProperty)(issue, 'priorityLabel');
    if (value === undefined && !label)
        return undefined;
    return (0, integration_helpers_1.removeUndefinedValues)({ value, label });
}
function buildLinearIssueSubject(issue, fallbackIssueId) {
    const identifier = (0, integration_helpers_1.stringProperty)(issue, 'identifier');
    const title = (0, integration_helpers_1.stringProperty)(issue, 'title');
    const description = (0, integration_helpers_1.stringProperty)(issue, 'description');
    const url = (0, integration_helpers_1.stringProperty)(issue, 'url');
    const status = (0, integration_helpers_1.stringProperty)((0, is_record_1.isRecord)(issue.state) ? issue.state : undefined, 'name');
    const labels = linearLabelNames(issue);
    const assignee = linearSubjectPerson(issue.assignee);
    return {
        type: 'issue',
        id: identifier ?? fallbackIssueId,
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(url ? { url } : {}),
        ...(status ? { status } : {}),
        ...(labels.length > 0 ? { labels } : {}),
        ...(assignee ? { assignee } : {}),
    };
}
function linearLabelNames(issue) {
    const labels = issue.labels;
    if (!Array.isArray(labels))
        return [];
    return labels
        .map((label) => (0, integration_helpers_1.stringProperty)(label, 'name'))
        .filter((label) => label !== undefined);
}
function linearSubjectPerson(value) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    const id = (0, integration_helpers_1.stringProperty)(value, 'userId') ?? (0, integration_helpers_1.stringProperty)(value, 'id');
    const name = (0, integration_helpers_1.stringProperty)(value, 'name') ?? (0, integration_helpers_1.stringProperty)(value, 'displayName');
    if (!id || !name)
        return undefined;
    return { id, name };
}
async function awaitableProperty(value, key) {
    if (!(0, is_record_1.isRecord)(value))
        return undefined;
    return await Promise.resolve(value[key]);
}
async function callLinearConnection(record, key, options) {
    const fn = record[key];
    if (typeof fn !== 'function')
        return undefined;
    return await fn.call(record, options);
}
function linearNodes(value) {
    if (!(0, is_record_1.isRecord)(value) || !Array.isArray(value.nodes))
        return [];
    return value.nodes;
}
//# sourceMappingURL=linear-operations.js.map