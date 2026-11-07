"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NON_FATAL_OPERATION_TYPES = exports.partialUpdateOperationSchema = exports.workflowSettingsInputSchema = exports.workflowSettingsObjectSchema = void 0;
exports.applyOperations = applyOperations;
exports.toWorkflowSlice = toWorkflowSlice;
const is_record_1 = require("@n8n/utils/is-record");
const luxon_1 = require("luxon");
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const positionSchema = () => zod_1.z
    .array(zod_1.z.number())
    .length(2)
    .transform((v) => [v[0], v[1]])
    .describe('Canvas position as [x, y]');
const credentialsSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.object({ id: zod_1.z.string().optional(), name: zod_1.z.string() }));
const isValidIanaTimezone = (tz) => luxon_1.IANAZone.isValidZone(tz);
exports.workflowSettingsObjectSchema = zod_1.z.object({
    errorWorkflow: zod_1.z
        .string()
        .describe('ID of a SEPARATE workflow to run whenever THIS workflow fails — the common best-practice way to send failure alerts (email, Slack, etc.) or log errors via a shared, reusable handler. The referenced workflow must contain an Error Trigger node; find its ID with search_workflows. Pass "DEFAULT" to clear it. Must be a plain ID — this setting is never evaluated, so an expression would be stored as a literal ID and the handler would never run. There are two ways to handle failures: (a) a dedicated/shared error workflow set here, or (b) an Error Trigger node placed directly inside THIS workflow (n8n fires it automatically on failure, no setting needed). When the user asks for error handling, ask which pattern they prefer before choosing. When errorWorkflow is set, it takes precedence over a same-workflow Error Trigger for the failing run. Failure handling fires for production executions only, not manual/test runs. Distinct from per-node onError/retry (setNodeSettings).')
        .optional(),
    timezone: zod_1.z
        .string()
        .refine((tz) => tz === 'DEFAULT' || isValidIanaTimezone(tz), {
        message: 'timezone must be a valid IANA timezone (e.g. "America/New_York"), or "DEFAULT" to inherit the instance timezone',
    })
        .describe('IANA timezone used by Schedule Triggers and date/time operations, e.g. "America/New_York". Pass "DEFAULT" to inherit the instance timezone.')
        .optional(),
    executionOrder: zod_1.z
        .enum(['v0', 'v1'])
        .describe('Node execution order. "v1" is the default for new workflows; "v0" is legacy.')
        .optional(),
    saveExecutionProgress: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.literal('DEFAULT')])
        .describe('Save execution data after each node finishes. Allows resuming/inspecting partial runs at the cost of speed.')
        .optional(),
    saveManualExecutions: zod_1.z
        .union([zod_1.z.boolean(), zod_1.z.literal('DEFAULT')])
        .describe('Whether manual (test) executions are saved to the execution list.')
        .optional(),
    saveDataErrorExecution: zod_1.z
        .enum(['DEFAULT', 'all', 'none'])
        .describe('Whether to store execution data for failed runs.')
        .optional(),
    saveDataSuccessExecution: zod_1.z
        .enum(['DEFAULT', 'all', 'none'])
        .describe('Whether to store execution data for successful runs.')
        .optional(),
    executionTimeout: zod_1.z
        .number()
        .int()
        .refine((n) => n === -1 || n >= 1, {
        message: 'executionTimeout must be a positive number of seconds, or -1 for unlimited',
    })
        .describe('Maximum execution time in seconds before a run is stopped. Use a positive number of seconds (not exceeding the instance maximum, enforced server-side), or -1 for unlimited (no timeout).')
        .optional(),
    timeSavedPerExecution: zod_1.z
        .number()
        .int()
        .nonnegative()
        .describe('Estimated time saved per execution, in minutes (used for insights/reporting).')
        .optional(),
    callerPolicy: zod_1.z
        .enum(['any', 'none', 'workflowsFromAList', 'workflowsFromSameOwner'])
        .describe('Which workflows may call this one via the Execute Sub-workflow node. Defaults to "workflowsFromSameOwner".')
        .optional(),
    callerIds: zod_1.z
        .string()
        .describe('Comma-separated workflow IDs allowed to call this workflow (only used with callerPolicy "workflowsFromAList").')
        .optional(),
});
exports.workflowSettingsInputSchema = exports.workflowSettingsObjectSchema.refine((s) => Object.keys(s).length > 0, { message: 'settings must specify at least one field' });
exports.partialUpdateOperationSchema = zod_1.z.discriminatedUnion('type', [
    zod_1.z.object({
        type: zod_1.z.literal('updateNodeParameters'),
        nodeName: zod_1.z.string().describe('Name of the existing node to update.'),
        parameters: zod_1.z
            .record(zod_1.z.string(), zod_1.z.unknown())
            .describe('Parameter object to merge into (or replace) the node parameters.'),
        replace: zod_1.z
            .boolean()
            .optional()
            .describe('If true, replace the node parameters entirely with `parameters`. If false or omitted, deep-merge `parameters` into the existing parameters.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setNodeParameter'),
        nodeName: zod_1.z.string().describe('Name of the existing node to update.'),
        path: zod_1.z
            .string()
            .min(2)
            .describe('JSON Pointer (RFC 6901) path, e.g. "/options/systemMessage" or "/assignments/assignments/0/value". Numeric segments index into an existing array element only — to add or remove elements, set the whole array (or its parent) instead. Prefer over `updateNodeParameters` for a single nested key — the payload stays small regardless of the rest of the parameters object.'),
        value: zod_1.z
            .unknown()
            .refine((v) => v !== undefined, { message: 'value is required' })
            .describe('Value to set at the path. Any defined JSON value.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('addNode'),
        node: zod_1.z
            .object({
            name: zod_1.z.string().describe('Unique node name. Must not collide with an existing node.'),
            type: zod_1.z.string().describe('Fully qualified node type, e.g. "n8n-nodes-base.set".'),
            typeVersion: zod_1.z.number(),
            parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
            position: positionSchema().optional(),
            credentials: credentialsSchema.optional(),
            disabled: zod_1.z.boolean().optional(),
            notes: zod_1.z.string().optional(),
            id: zod_1.z.string().optional().describe('Optional node id. Generated if omitted.'),
        })
            .describe('The node to add to the workflow.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('removeNode'),
        nodeName: zod_1.z
            .string()
            .describe('Name of the node to remove. All inbound and outbound connections are removed, including any sub-node attachments (LLM models, memory, tools) — the sub-nodes themselves remain in the workflow but become disconnected and will not be re-attached automatically. To modify a node, use updateNodeParameters or setNodeParameter instead.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('renameNode'),
        oldName: zod_1.z.string(),
        newName: zod_1.z.string().describe('New unique node name.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('addConnection'),
        source: zod_1.z.string().describe('Name of the source node.'),
        target: zod_1.z.string().describe('Name of the target node.'),
        sourceIndex: zod_1.z
            .number()
            .int()
            .nonnegative()
            .optional()
            .describe('Source output index. Default 0. The false branch of an If node is index 1, and the error output added by onError "continueErrorOutput" comes after the regular outputs (index 1 on a single-output node, index 2 on an If node).'),
        targetIndex: zod_1.z
            .number()
            .int()
            .nonnegative()
            .optional()
            .describe('Target input index. Default 0.'),
        connectionType: zod_1.z
            .string()
            .optional()
            .describe('Connection type, e.g. "main" or "ai_languageModel". Default "main".'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('removeConnection'),
        source: zod_1.z.string(),
        target: zod_1.z.string(),
        sourceIndex: zod_1.z.number().int().nonnegative().optional(),
        targetIndex: zod_1.z.number().int().nonnegative().optional(),
        connectionType: zod_1.z.string().optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setNodeCredential'),
        nodeName: zod_1.z.string(),
        credentialKey: zod_1.z
            .string()
            .describe('Credential key on the node, e.g. "slackApi" or "httpHeaderAuth".'),
        credentialId: zod_1.z.string(),
        credentialName: zod_1.z.string(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setNodePosition'),
        nodeName: zod_1.z.string(),
        position: positionSchema(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setNodeDisabled'),
        nodeName: zod_1.z.string(),
        disabled: zod_1.z.boolean(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setNodeSettings'),
        nodeName: zod_1.z.string().describe('Name of the existing node to update.'),
        settings: zod_1.z
            .object({
            onError: zod_1.z
                .enum(['stopWorkflow', 'continueRegularOutput', 'continueErrorOutput'])
                .optional()
                .describe('How the node behaves on error. "stopWorkflow" halts the run; "continueRegularOutput" forwards an empty item on the main output; "continueErrorOutput" routes the failure to the node\'s error output, which is appended after the regular outputs — wire it with addConnection and a matching sourceIndex (1 on a single-output node). Required for sub-nodes (LLM model, memory, tools) since the canvas UI does not expose this setting for them.'),
            retryOnFail: zod_1.z.boolean().optional(),
            maxTries: zod_1.z
                .number()
                .int()
                .min(2)
                .max(5)
                .optional()
                .describe('Number of attempts when retryOnFail is true (2–5).'),
            waitBetweenTries: zod_1.z
                .number()
                .int()
                .min(0)
                .max(5000)
                .optional()
                .describe('Milliseconds to wait between retry attempts (0–5000).'),
            alwaysOutputData: zod_1.z.boolean().optional(),
            executeOnce: zod_1.z.boolean().optional(),
        })
            .refine((s) => Object.keys(s).length > 0, {
            message: 'settings must specify at least one field',
        })
            .describe('Node-level execution settings. Only the keys you include are written; omitted keys are left unchanged.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setWorkflowMetadata'),
        name: zod_1.z.string().max(128).optional(),
        description: zod_1.z.string().max(255).optional(),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setWorkflowSettings'),
        settings: exports.workflowSettingsInputSchema.describe('Workflow-level settings to update. Only the keys you include are written; omitted keys are left unchanged.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('addTags'),
        names: zod_1.z
            .array(zod_1.z.string().trim().min(1).max(24))
            .min(1)
            .max(50)
            .describe('Tag names to attach. Unknown names are auto-created. Idempotent.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('removeTags'),
        names: zod_1.z
            .array(zod_1.z.string().trim().min(1).max(24))
            .min(1)
            .max(50)
            .describe('Tag names to detach from the workflow. Unknown names are ignored.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('setNodeGroups'),
        nodeGroups: zod_1.z
            .array(zod_1.z.object({
            id: zod_1.z.string().trim().min(1).optional().describe('Group id. Generated if omitted.'),
            name: zod_1.z.string().trim().min(1).describe('Unique group name.'),
            nodeNames: zod_1.z
                .array(zod_1.z.string().trim().min(1))
                .describe('Names of the nodes that belong to this group.'),
            description: zod_1.z
                .string()
                .trim()
                .max(n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH)
                .optional()
                .describe(`Optional description shown when the group is collapsed. Max ${n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH} characters.`),
        }))
            .describe('Replaces the workflow node groups entirely. Pass [] to remove all groups. Each nodeName must reference an existing node, and every group must form a valid, connected, trigger-free section of the graph (validated on save).'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('addNodeGroup'),
        name: zod_1.z.string().trim().min(1).describe('Name for the new group. Must be unique.'),
        nodeNames: zod_1.z
            .array(zod_1.z.string().trim().min(1))
            .min(1)
            .describe('Names of the nodes that belong to this group. The nodes must form a valid, connected, trigger-free section of the graph (validated on save).'),
        description: zod_1.z
            .string()
            .trim()
            .max(n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH)
            .optional()
            .describe(`Optional description shown when the group is collapsed. Max ${n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH} characters.`),
        id: zod_1.z.string().trim().min(1).optional().describe('Group id. Generated if omitted.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('removeNodeGroup'),
        groupName: zod_1.z
            .string()
            .trim()
            .min(1)
            .describe('Name of the group to remove. The grouped nodes themselves are kept.'),
    }),
    zod_1.z.object({
        type: zod_1.z.literal('updateNodeGroup'),
        groupName: zod_1.z.string().trim().min(1).describe('Name of the existing group to update.'),
        newName: zod_1.z.string().trim().min(1).optional().describe('New unique group name.'),
        nodeNames: zod_1.z
            .array(zod_1.z.string().trim().min(1))
            .min(1)
            .optional()
            .describe('Replaces the group membership entirely with these node names.'),
        description: zod_1.z
            .string()
            .trim()
            .max(n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH)
            .optional()
            .describe(`New description shown when the group is collapsed (max ${n8n_workflow_1.GROUP_DESCRIPTION_MAX_LENGTH} characters). Pass "" to clear it. Omit to leave unchanged.`),
    }),
]);
exports.NON_FATAL_OPERATION_TYPES = new Set([
    'setNodeGroups',
    'addNodeGroup',
    'removeNodeGroup',
    'updateNodeGroup',
]);
const cloneWorkflow = (workflow) => ({
    name: workflow.name,
    description: workflow.description,
    nodes: workflow.nodes.map((node) => structuredClone(node)),
    connections: structuredClone(workflow.connections),
    settings: workflow.settings ? structuredClone(workflow.settings) : undefined,
    nodeGroups: workflow.nodeGroups ? structuredClone(workflow.nodeGroups) : undefined,
    tagNames: workflow.tagNames ? [...workflow.tagNames] : undefined,
});
const sanitizeUnsafeKeys = (value) => {
    if (Array.isArray(value))
        return value.map(sanitizeUnsafeKeys);
    if (!(0, is_record_1.isRecord)(value))
        return value;
    const out = {};
    for (const [key, v] of Object.entries(value)) {
        if (!(0, n8n_workflow_1.isSafeObjectProperty)(key))
            continue;
        out[key] = sanitizeUnsafeKeys(v);
    }
    return out;
};
const parseJsonPointer = (path) => {
    if (!path.startsWith('/')) {
        return null;
    }
    const tail = path.slice(1);
    if (tail.length === 0) {
        return null;
    }
    const rawSegments = tail.split('/');
    const segments = [];
    const invalidEscapeSequenceRegex = /~(?:[^01]|$)/;
    for (const raw of rawSegments) {
        if (invalidEscapeSequenceRegex.test(raw)) {
            return null;
        }
        const seg = raw.replace(/~1/g, '/').replace(/~0/g, '~');
        if (seg.length === 0 || !(0, n8n_workflow_1.isSafeObjectProperty)(seg)) {
            return null;
        }
        segments.push(seg);
    }
    return segments;
};
const isArrayIndexSegment = (segment) => /^(0|[1-9]\d*)$/.test(segment);
const readSegment = (cursor, key, failingPathForErrorMessage) => {
    if (!Array.isArray(cursor)) {
        return { value: cursor[key] };
    }
    if (!isArrayIndexSegment(key)) {
        return { error: `cannot use '${key}' as an array index at '/${failingPathForErrorMessage}'` };
    }
    const index = Number(key);
    if (index >= cursor.length) {
        return {
            error: `array index ${index} out of bounds (length ${cursor.length}) at '/${failingPathForErrorMessage}'`,
        };
    }
    return { value: cursor[index] };
};
const writeSegment = (cursor, key, value) => {
    if (Array.isArray(cursor)) {
        cursor[Number(key)] = value;
        return;
    }
    cursor[key] = value;
};
const setAtPointer = (root, segments, value) => {
    let cursor = root;
    for (let i = 0; i < segments.length - 1; i++) {
        const key = segments[i];
        const failingPathSegmentReadingFailure = segments.slice(0, i).join('/');
        const read = readSegment(cursor, key, failingPathSegmentReadingFailure);
        if ('error' in read) {
            return read.error;
        }
        if (read.value === undefined && !Array.isArray(cursor)) {
            const nextKey = segments[i + 1];
            if (isArrayIndexSegment(nextKey)) {
                const containerPath = segments.slice(0, i + 1).join('/');
                return `cannot create array at '/${containerPath}' for numeric segment '${nextKey}' — set the whole array via updateNodeParameters instead`;
            }
            const child = {};
            writeSegment(cursor, key, child);
            cursor = child;
        }
        else if ((0, is_record_1.isRecord)(read.value) || Array.isArray(read.value)) {
            cursor = read.value;
        }
        else {
            const failingPath = segments.slice(0, i + 1).join('/');
            return `cannot descend into non-object at '/${failingPath}'`;
        }
    }
    const lastKey = segments[segments.length - 1];
    if (Array.isArray(cursor)) {
        const failingPathWithoutIndex = segments.slice(0, -1).join('/');
        if (!isArrayIndexSegment(lastKey)) {
            return `cannot use '${lastKey}' as an array index at '/${failingPathWithoutIndex}'`;
        }
        const index = Number(lastKey);
        if (index >= cursor.length) {
            return `array index ${index} out of bounds (length ${cursor.length}) at '/${failingPathWithoutIndex}'`;
        }
    }
    writeSegment(cursor, lastKey, sanitizeUnsafeKeys(value));
    return null;
};
const deepMerge = (target, source) => {
    const result = { ...target };
    for (const [key, value] of Object.entries(source)) {
        if (!(0, n8n_workflow_1.isSafeObjectProperty)(key))
            continue;
        const existing = Object.prototype.hasOwnProperty.call(result, key) ? result[key] : undefined;
        if ((0, is_record_1.isRecord)(existing) && (0, is_record_1.isRecord)(value)) {
            result[key] = deepMerge(existing, value);
        }
        else {
            result[key] = sanitizeUnsafeKeys(value);
        }
    }
    return result;
};
const removeConnectionsFor = (connections, nodeName) => {
    delete connections[nodeName];
    for (const sourceName of Object.keys(connections)) {
        const byType = connections[sourceName];
        for (const connectionType of Object.keys(byType)) {
            const outputs = byType[connectionType];
            for (let i = 0; i < outputs.length; i++) {
                const targets = outputs[i];
                if (!targets)
                    continue;
                outputs[i] = targets.filter((c) => c.node !== nodeName);
            }
            if (outputs.every((o) => !o || o.length === 0)) {
                delete byType[connectionType];
            }
        }
        if (Object.keys(byType).length === 0) {
            delete connections[sourceName];
        }
    }
};
const renameInConnections = (connections, oldName, newName) => {
    if (connections[oldName]) {
        connections[newName] = connections[oldName];
        delete connections[oldName];
    }
    for (const sourceName of Object.keys(connections)) {
        const byType = connections[sourceName];
        for (const connectionType of Object.keys(byType)) {
            const outputs = byType[connectionType];
            for (const targets of outputs) {
                if (!targets)
                    continue;
                for (const conn of targets) {
                    if (conn.node === oldName)
                        conn.node = newName;
                }
            }
        }
    }
};
const ensureOutputSlot = (connections, source, connectionType, sourceIndex) => {
    const byType = (connections[source] ??= {});
    const outputs = (byType[connectionType] ??= []);
    while (outputs.length <= sourceIndex)
        outputs.push(null);
    const slot = outputs[sourceIndex] ?? [];
    outputs[sourceIndex] = slot;
    return slot;
};
const pruneConnectionShape = (connections, source, connectionType) => {
    const byType = connections[source];
    if (!byType)
        return;
    const outputs = byType[connectionType];
    if (outputs?.every((o) => !o || o.length === 0)) {
        delete byType[connectionType];
    }
    if (Object.keys(byType).length === 0) {
        delete connections[source];
    }
};
const fail = (opIndex, message) => ({
    success: false,
    error: `Operation ${opIndex} failed: ${message}`,
    opIndex,
});
const resolveGroupNodeIds = (nodeByName, nodeNames, groupName) => {
    const nodeIds = new Set();
    for (const nodeName of nodeNames) {
        const node = nodeByName.get(nodeName);
        if (!node) {
            return { error: `node '${nodeName}' in group '${groupName}' not found` };
        }
        nodeIds.add(node.id);
    }
    return { nodeIds: [...nodeIds] };
};
const handleUpdateNodeParameters = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    const sanitized = sanitizeUnsafeKeys(op.parameters);
    const merged = op.replace ? sanitized : deepMerge(node.parameters ?? {}, sanitized);
    node.parameters = merged;
    return null;
};
const handleSetNodeParameter = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    const segments = parseJsonPointer(op.path);
    if (!segments) {
        return `path '${op.path}' is invalid or contains unsafe segments`;
    }
    const params = (node.parameters ?? {});
    const setError = setAtPointer(params, segments, op.value);
    if (setError) {
        return setError;
    }
    node.parameters = params;
    return null;
};
const handleAddNode = (op, ctx) => {
    if (!(0, n8n_workflow_1.isSafeObjectProperty)(op.node.name)) {
        return `node name '${op.node.name}' is not allowed`;
    }
    if (ctx.nodeByName.has(op.node.name)) {
        return `a node named '${op.node.name}' already exists`;
    }
    const node = {
        id: op.node.id ?? (0, uuid_1.v4)(),
        name: op.node.name,
        type: op.node.type,
        typeVersion: op.node.typeVersion,
        position: op.node.position ?? [0, 0],
        parameters: (sanitizeUnsafeKeys(op.node.parameters ?? {}) ?? {}),
    };
    if (op.node.credentials) {
        const credentialEntries = [];
        for (const [key, cred] of Object.entries(op.node.credentials)) {
            if (!(0, n8n_workflow_1.isSafeObjectProperty)(key)) {
                return `credential key '${key}' is not allowed`;
            }
            credentialEntries.push([key, { id: cred.id ?? null, name: cred.name }]);
        }
        node.credentials = Object.fromEntries(credentialEntries);
    }
    if (op.node.disabled !== undefined) {
        node.disabled = op.node.disabled;
    }
    if (op.node.notes !== undefined) {
        node.notes = op.node.notes;
    }
    ctx.workflow.nodes.push(node);
    ctx.nodeByName.set(node.name, node);
    ctx.addedNodeNames.add(node.name);
    return null;
};
const handleRemoveNode = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    ctx.workflow.nodes.splice(ctx.workflow.nodes.indexOf(node), 1);
    ctx.nodeByName.delete(op.nodeName);
    removeConnectionsFor(ctx.workflow.connections, op.nodeName);
    ctx.addedNodeNames.delete(op.nodeName);
    if (ctx.workflow.nodeGroups?.length) {
        const prunedGroups = [];
        for (const group of ctx.workflow.nodeGroups) {
            if (!group.nodeIds.includes(node.id)) {
                prunedGroups.push(group);
                continue;
            }
            ctx.nodeGroupsChanged = true;
            const remaining = group.nodeIds.filter((id) => id !== node.id);
            if (remaining.length > 0) {
                prunedGroups.push({ ...group, nodeIds: remaining });
            }
            else {
                ctx.groupOperations.delete(group.id);
            }
        }
        ctx.workflow.nodeGroups = prunedGroups;
    }
    return null;
};
const handleRenameNode = (op, ctx) => {
    if (op.oldName === op.newName) {
        return null;
    }
    if (!(0, n8n_workflow_1.isSafeObjectProperty)(op.newName)) {
        return `node name '${op.newName}' is not allowed`;
    }
    const node = ctx.nodeByName.get(op.oldName);
    if (!node) {
        return `node '${op.oldName}' not found`;
    }
    if (ctx.nodeByName.has(op.newName)) {
        return `a node named '${op.newName}' already exists`;
    }
    node.name = op.newName;
    ctx.nodeByName.delete(op.oldName);
    ctx.nodeByName.set(op.newName, node);
    renameInConnections(ctx.workflow.connections, op.oldName, op.newName);
    if (ctx.addedNodeNames.delete(op.oldName)) {
        ctx.addedNodeNames.add(op.newName);
    }
    return null;
};
const handleAddConnection = (op, ctx) => {
    if (!ctx.nodeByName.has(op.source)) {
        return `source node '${op.source}' not found`;
    }
    if (!ctx.nodeByName.has(op.target)) {
        return `target node '${op.target}' not found`;
    }
    const connectionType = (op.connectionType ?? n8n_workflow_1.NodeConnectionTypes.Main);
    if (!(0, n8n_workflow_1.isSafeObjectProperty)(op.source) || !(0, n8n_workflow_1.isSafeObjectProperty)(connectionType)) {
        return 'connection name is not allowed';
    }
    const sourceIndex = op.sourceIndex ?? 0;
    const targetIndex = op.targetIndex ?? 0;
    const slot = ensureOutputSlot(ctx.workflow.connections, op.source, connectionType, sourceIndex);
    const exists = slot.some((c) => c.node === op.target && c.type === connectionType && c.index === targetIndex);
    if (!exists)
        slot.push({ node: op.target, type: connectionType, index: targetIndex });
    return null;
};
const handleRemoveConnection = (op, ctx) => {
    const connectionType = (op.connectionType ?? n8n_workflow_1.NodeConnectionTypes.Main);
    const sourceIndex = op.sourceIndex ?? 0;
    const targetIndex = op.targetIndex ?? 0;
    const byType = ctx.workflow.connections[op.source];
    const outputs = byType?.[connectionType];
    const slot = outputs?.[sourceIndex];
    if (!slot) {
        return `no '${connectionType}' connection from '${op.source}'`;
    }
    const filtered = slot.filter((c) => !(c.node === op.target && c.type === connectionType && c.index === targetIndex));
    if (filtered.length === slot.length) {
        return `connection from '${op.source}'[${sourceIndex}] to '${op.target}'[${targetIndex}] does not exist`;
    }
    outputs[sourceIndex] = filtered;
    pruneConnectionShape(ctx.workflow.connections, op.source, connectionType);
    return null;
};
const handleSetNodeCredential = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    if (!(0, n8n_workflow_1.isSafeObjectProperty)(op.credentialKey)) {
        return `credential key '${op.credentialKey}' is not allowed`;
    }
    node.credentials = {
        ...(node.credentials ?? {}),
        [op.credentialKey]: { id: op.credentialId, name: op.credentialName },
    };
    return null;
};
const handleSetNodePosition = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    node.position = op.position;
    return null;
};
const handleSetNodeDisabled = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    node.disabled = op.disabled;
    return null;
};
const handleSetNodeSettings = (op, ctx) => {
    const node = ctx.nodeByName.get(op.nodeName);
    if (!node) {
        return `node '${op.nodeName}' not found`;
    }
    const s = op.settings;
    if (s.onError !== undefined) {
        node.onError = s.onError;
    }
    if (s.retryOnFail !== undefined) {
        node.retryOnFail = s.retryOnFail;
    }
    if (s.maxTries !== undefined) {
        node.maxTries = s.maxTries;
    }
    if (s.waitBetweenTries !== undefined) {
        node.waitBetweenTries = s.waitBetweenTries;
    }
    if (s.alwaysOutputData !== undefined) {
        node.alwaysOutputData = s.alwaysOutputData;
    }
    if (s.executeOnce !== undefined) {
        node.executeOnce = s.executeOnce;
    }
    return null;
};
const handleSetWorkflowMetadata = (op, ctx) => {
    if (op.name !== undefined) {
        ctx.workflow.name = op.name;
    }
    if (op.description !== undefined) {
        ctx.workflow.description = op.description;
    }
    return null;
};
const handleSetWorkflowSettings = (op, ctx) => {
    ctx.workflow.settings = { ...(ctx.workflow.settings ?? {}), ...op.settings };
    return null;
};
const handleSetNodeGroups = (op, ctx, opIndex) => {
    const nodeGroups = [];
    for (const group of op.nodeGroups) {
        const resolved = resolveGroupNodeIds(ctx.nodeByName, group.nodeNames, group.name);
        if ('error' in resolved) {
            return resolved.error;
        }
        const description = group.description?.trim();
        nodeGroups.push({
            id: group.id ?? (0, uuid_1.v4)(),
            name: group.name,
            nodeIds: resolved.nodeIds,
            ...(description ? { description } : {}),
        });
    }
    ctx.workflow.nodeGroups = nodeGroups;
    ctx.nodeGroupsChanged = true;
    ctx.groupOperations = new Map(nodeGroups.map((group) => [group.id, { opIndex, type: 'setNodeGroups' }]));
    return null;
};
const handleAddNodeGroup = (op, ctx, opIndex) => {
    const groups = ctx.workflow.nodeGroups ?? [];
    if (groups.some((g) => g.name === op.name)) {
        return `a node group named '${op.name}' already exists`;
    }
    if (op.id !== undefined && groups.some((g) => g.id === op.id)) {
        return `a node group with id '${op.id}' already exists`;
    }
    const resolved = resolveGroupNodeIds(ctx.nodeByName, op.nodeNames, op.name);
    if ('error' in resolved) {
        return resolved.error;
    }
    const description = op.description?.trim();
    const newGroup = {
        id: op.id ?? (0, uuid_1.v4)(),
        name: op.name,
        nodeIds: resolved.nodeIds,
        ...(description ? { description } : {}),
    };
    groups.push(newGroup);
    ctx.workflow.nodeGroups = groups;
    ctx.nodeGroupsChanged = true;
    ctx.groupOperations.set(newGroup.id, { opIndex, type: 'addNodeGroup' });
    return null;
};
const handleRemoveNodeGroup = (op, ctx) => {
    const groups = ctx.workflow.nodeGroups ?? [];
    const index = groups.findIndex((g) => g.name === op.groupName);
    if (index === -1) {
        return `node group '${op.groupName}' not found`;
    }
    const [removed] = groups.splice(index, 1);
    ctx.workflow.nodeGroups = groups;
    ctx.nodeGroupsChanged = true;
    ctx.groupOperations.delete(removed.id);
    return null;
};
const handleUpdateNodeGroup = (op, ctx, opIndex) => {
    if (op.newName === undefined && op.nodeNames === undefined && op.description === undefined) {
        return 'updateNodeGroup must specify at least one of newName, nodeNames, or description';
    }
    const groups = ctx.workflow.nodeGroups ?? [];
    const group = groups.find((g) => g.name === op.groupName);
    if (!group) {
        return `node group '${op.groupName}' not found`;
    }
    let nodeIds;
    if (op.nodeNames !== undefined) {
        const resolved = resolveGroupNodeIds(ctx.nodeByName, op.nodeNames, op.groupName);
        if ('error' in resolved) {
            return resolved.error;
        }
        nodeIds = resolved.nodeIds;
    }
    const newName = op.newName !== undefined && op.newName !== group.name ? op.newName : undefined;
    if (newName !== undefined && groups.some((g) => g !== group && g.name === newName)) {
        return `a node group named '${newName}' already exists`;
    }
    if (nodeIds !== undefined) {
        group.nodeIds = nodeIds;
    }
    if (newName !== undefined) {
        group.name = newName;
    }
    if (op.description !== undefined) {
        const description = op.description.trim();
        if (description) {
            group.description = description;
        }
        else {
            delete group.description;
        }
    }
    ctx.nodeGroupsChanged = true;
    ctx.groupOperations.set(group.id, { opIndex, type: 'updateNodeGroup' });
    return null;
};
const handleTagOp = (op, ctx) => {
    if (ctx.workflow.tagNames === undefined) {
        return 'tag operations require existing tags to be loaded';
    }
    ctx.tagSet ??= new Set(ctx.workflow.tagNames);
    if (op.type === 'addTags') {
        for (const name of op.names) {
            ctx.tagSet.add(name);
        }
        return null;
    }
    for (const name of op.names) {
        ctx.tagSet.delete(name);
    }
    return null;
};
const OPERATION_HANDLERS = {
    updateNodeParameters: handleUpdateNodeParameters,
    setNodeParameter: handleSetNodeParameter,
    addNode: handleAddNode,
    removeNode: handleRemoveNode,
    renameNode: handleRenameNode,
    addConnection: handleAddConnection,
    removeConnection: handleRemoveConnection,
    setNodeCredential: handleSetNodeCredential,
    setNodePosition: handleSetNodePosition,
    setNodeDisabled: handleSetNodeDisabled,
    setNodeSettings: handleSetNodeSettings,
    setWorkflowMetadata: handleSetWorkflowMetadata,
    setWorkflowSettings: handleSetWorkflowSettings,
    setNodeGroups: handleSetNodeGroups,
    addNodeGroup: handleAddNodeGroup,
    removeNodeGroup: handleRemoveNodeGroup,
    updateNodeGroup: handleUpdateNodeGroup,
    addTags: (op, ctx, opIndex) => handleTagOp(op, ctx, opIndex),
    removeTags: (op, ctx, opIndex) => handleTagOp(op, ctx, opIndex),
};
function applyOperations(input, operations) {
    const skippedOperations = [];
    const workflow = cloneWorkflow(input);
    const ctx = {
        workflow,
        nodeByName: new Map(workflow.nodes.map((n) => [n.name, n])),
        addedNodeNames: new Set(),
        tagSet: null,
        nodeGroupsChanged: false,
        groupOperations: new Map(),
    };
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        const handler = OPERATION_HANDLERS[op.type];
        const error = handler(op, ctx, i);
        if (error) {
            if (exports.NON_FATAL_OPERATION_TYPES.has(op.type)) {
                skippedOperations.push({ opIndex: i, type: op.type, reason: error });
                continue;
            }
            return fail(i, error);
        }
    }
    if (ctx.tagSet !== null) {
        ctx.workflow.tagNames = [...ctx.tagSet];
    }
    return {
        success: true,
        workflow: ctx.workflow,
        addedNodeNames: [...ctx.addedNodeNames],
        tagNames: ctx.tagSet !== null ? [...ctx.tagSet] : undefined,
        nodeGroupsChanged: ctx.nodeGroupsChanged,
        skippedOperations,
        groupOperations: Object.fromEntries(ctx.groupOperations),
    };
}
function toWorkflowSlice(workflow, options = {}) {
    let tagNames;
    if (options.includeTags) {
        const tags = workflow.tags;
        if (tags === undefined) {
            throw new Error('toWorkflowSlice: includeTags=true requires the tags relation to be loaded.');
        }
        tagNames = tags.map((t) => t.name);
    }
    return {
        name: workflow.name ?? '',
        description: workflow.description,
        nodes: workflow.nodes,
        connections: workflow.connections,
        settings: workflow.settings,
        nodeGroups: workflow.nodeGroups,
        tagNames,
    };
}
//# sourceMappingURL=workflow-operations.js.map