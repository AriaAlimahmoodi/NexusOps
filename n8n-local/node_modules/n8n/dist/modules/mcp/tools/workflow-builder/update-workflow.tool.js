"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUpdateWorkflowTool = void 0;
const db_1 = require("@n8n/db");
const permissions_1 = require("@n8n/permissions");
const workflow_sdk_1 = require("@n8n/workflow-sdk");
const isEqual_1 = __importDefault(require("lodash/isEqual"));
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const workflow_helpers_1 = require("../../../../workflow-helpers");
const error_workflow_validation_service_1 = require("../../../../workflows/error-workflow-validation.service");
const execution_timeout_validation_1 = require("../../../../workflows/execution-timeout-validation");
const connection_structure_check_1 = require("./connection-structure-check");
const constants_1 = require("./constants");
const credential_validation_1 = require("./credential-validation");
const credentials_auto_assign_1 = require("./credentials-auto-assign");
const data_table_validation_1 = require("./data-table-validation");
const error_code_utils_1 = require("./error-code.utils");
const skills_used_1 = require("./skills-used");
const top_level_items_warning_1 = require("./top-level-items-warning");
const uninstalled_node_warnings_1 = require("./uninstalled-node-warnings");
const version_metadata_1 = require("./version-metadata");
const workflow_operations_1 = require("./workflow-operations");
const mcp_constants_1 = require("../../mcp.constants");
const workflow_validation_utils_1 = require("../workflow-validation.utils");
const MAX_OPERATIONS_PER_CALL = 100;
const normalize = (value) => JSON.parse(JSON.stringify(value ?? null));
const operationTypes = [
    'updateNodeParameters',
    'setNodeParameter',
    'addNode',
    'removeNode',
    'renameNode',
    'addConnection',
    'removeConnection',
    'setNodeCredential',
    'setNodePosition',
    'setNodeDisabled',
    'setNodeSettings',
    'setWorkflowMetadata',
    'setWorkflowSettings',
    'addTags',
    'removeTags',
    'setNodeGroups',
    'addNodeGroup',
    'removeNodeGroup',
    'updateNodeGroup',
];
const operationTypeSchema = zod_1.z.enum(operationTypes);
const GRAPH_OPERATION_TYPES = new Set([
    'addNode',
    'removeNode',
    'renameNode',
    'updateNodeParameters',
    'setNodeParameter',
    'addConnection',
    'removeConnection',
    'setNodeCredential',
    'setNodePosition',
    'setNodeDisabled',
    'setNodeGroups',
    'addNodeGroup',
    'removeNodeGroup',
    'updateNodeGroup',
    'setNodeSettings',
]);
const positionInputSchema = () => zod_1.z.array(zod_1.z.number()).length(2).describe('Canvas [x, y].');
const credentialsInputSchema = zod_1.z.record(zod_1.z.string(), zod_1.z.object({ id: zod_1.z.string().optional(), name: zod_1.z.string() }));
const nodeInputSchema = zod_1.z.object({
    name: zod_1.z.string().describe('Unique node name.'),
    type: zod_1.z.string().describe('Node type, e.g. "n8n-nodes-base.set".'),
    typeVersion: zod_1.z.number(),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    position: positionInputSchema().optional(),
    credentials: credentialsInputSchema.optional(),
    disabled: zod_1.z.boolean().optional(),
    notes: zod_1.z.string().optional(),
    id: zod_1.z.string().optional(),
});
const nodeSettingsInputSchema = zod_1.z.object({
    onError: zod_1.z
        .enum(['stopWorkflow', 'continueRegularOutput', 'continueErrorOutput'])
        .optional()
        .describe('Error behavior. "continueErrorOutput" appends an error output after the node\'s regular outputs — index 1 on a single-output node such as HTTP Request. Wire that branch with an addConnection operation whose sourceIndex is that index.'),
    retryOnFail: zod_1.z.boolean().optional(),
    maxTries: zod_1.z.number().int().min(2).max(5).optional(),
    waitBetweenTries: zod_1.z.number().int().min(0).max(5000).optional(),
    alwaysOutputData: zod_1.z.boolean().optional(),
    executeOnce: zod_1.z.boolean().optional(),
});
const combinedSettingsInputSchema = zod_1.z
    .object({
    ...nodeSettingsInputSchema.shape,
    ...workflow_operations_1.workflowSettingsObjectSchema.shape,
})
    .describe('Settings to write. For setNodeSettings use the node-level keys (onError, retryOnFail, maxTries, waitBetweenTries, alwaysOutputData, executeOnce). For setWorkflowSettings use the workflow-level keys (errorWorkflow, timezone, executionOrder, saveExecutionProgress, saveManualExecutions, saveDataErrorExecution, saveDataSuccessExecution, executionTimeout, timeSavedPerExecution, callerPolicy, callerIds). Provide only the keys for the operation you are running.');
const operationInputSchema = zod_1.z
    .object({
    type: operationTypeSchema.describe('Operation type.'),
    nodeName: zod_1.z.string().optional().describe('For node-targeted ops.'),
    node: nodeInputSchema.optional().describe('For addNode.'),
    parameters: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional().describe('For updateNodeParameters.'),
    replace: zod_1.z.boolean().optional().describe('For updateNodeParameters; default false.'),
    path: zod_1.z.string().min(2).optional().describe('For setNodeParameter; JSON Pointer path.'),
    value: zod_1.z.unknown().optional().describe('For setNodeParameter.'),
    oldName: zod_1.z.string().optional().describe('For renameNode.'),
    newName: zod_1.z.string().optional().describe('For renameNode or updateNodeGroup.'),
    source: zod_1.z.string().optional().describe('For connection ops.'),
    target: zod_1.z.string().optional().describe('For connection ops.'),
    sourceIndex: zod_1.z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('For connection ops; which output of the source node the connection starts from. Default 0, the first output. Use it to wire a branch: on an If node the false branch is index 1, and onError "continueErrorOutput" appends an error output after the regular ones (index 1 on a single-output node such as HTTP Request, index 2 on an If node). This is the only field that selects an output.'),
    targetIndex: zod_1.z
        .number()
        .int()
        .nonnegative()
        .optional()
        .describe('For connection ops; which input of the target node the connection ends at. Default 0.'),
    connectionType: zod_1.z.string().optional().describe('For connection ops; default "main".'),
    credentialKey: zod_1.z.string().optional().describe('For setNodeCredential.'),
    credentialId: zod_1.z.string().optional().describe('For setNodeCredential.'),
    credentialName: zod_1.z.string().optional().describe('For setNodeCredential.'),
    position: positionInputSchema().optional().describe('For setNodePosition.'),
    disabled: zod_1.z.boolean().optional().describe('For setNodeDisabled.'),
    settings: combinedSettingsInputSchema
        .optional()
        .describe('For setNodeSettings or setWorkflowSettings.'),
    name: zod_1.z
        .string()
        .max(128)
        .optional()
        .describe('For setWorkflowMetadata (workflow name) or addNodeGroup (group name).'),
    description: zod_1.z
        .string()
        .max(255)
        .optional()
        .describe('For setWorkflowMetadata, addNodeGroup, or updateNodeGroup.'),
    names: zod_1.z.array(zod_1.z.string()).optional().describe('For addTags / removeTags.'),
    nodeGroups: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().optional(),
        name: zod_1.z.string(),
        nodeNames: zod_1.z.array(zod_1.z.string()),
        description: zod_1.z.string().optional(),
    }))
        .optional()
        .describe('For setNodeGroups. Replaces all node groups; pass [] to clear. Group members are node names, not ids.'),
    groupName: zod_1.z.string().optional().describe('For removeNodeGroup / updateNodeGroup.'),
    nodeNames: zod_1.z
        .array(zod_1.z.string())
        .optional()
        .describe('For addNodeGroup / updateNodeGroup; group member node names.'),
    id: zod_1.z.string().optional().describe('For addNodeGroup; group id, generated if omitted.'),
})
    .strict()
    .describe('Workflow update operation. Provide fields matching type.');
const strictOperationsSchema = zod_1.z.array(workflow_operations_1.partialUpdateOperationSchema);
function parseStrictOperations(operations) {
    const parsed = strictOperationsSchema.safeParse(operations);
    if (parsed.success) {
        return parsed.data;
    }
    const details = parsed.error.issues
        .map(({ path, message }) => {
        const [index, ...rest] = path;
        if (typeof index === 'number') {
            return `operation ${index}${rest.length ? `.${rest.join('.')}` : ''}: ${message}`;
        }
        return `${path.length ? path.join('.') : 'operations'}: ${message}`;
    })
        .join('; ');
    throw new Error(`Invalid operations: ${details}`);
}
const NON_FATAL_OPERATION_TYPES_LIST = [...workflow_operations_1.NON_FATAL_OPERATION_TYPES].join(', ');
const TOOL_DESCRIPTION = `Atomically update an existing workflow with operation objects. Edits nodes/connections and also workflow-level settings via setWorkflowSettings — including the error workflow that runs automatically on failure to send alerts (e.g. when a user asks to "add error handling" or "notify me if this breaks"). Pass skillsUsed if n8n skills were used. Node-group operations (${NON_FATAL_OPERATION_TYPES_LIST}) are the one exception to "atomically": an invalid one is skipped and reported in skippedOperations instead of aborting the whole update. Separately, if other edits in the batch make an existing group invalid, that group is removed and reported in removedGroups.`;
const inputSchema = {
    workflowId: zod_1.z.string().describe('The ID of the workflow to update.'),
    skillsUsed: zod_1.z.array(zod_1.z.string()).optional().describe(skills_used_1.SKILLS_USED_PARAM_DESCRIPTION),
    operations: zod_1.z
        .array(operationInputSchema)
        .min(1)
        .max(MAX_OPERATIONS_PER_CALL)
        .describe(`Ordered operations to apply atomically (max ${MAX_OPERATIONS_PER_CALL}). If any op fails, nothing is saved — except node-group operations (${NON_FATAL_OPERATION_TYPES_LIST}): an invalid one is skipped and reported in skippedOperations, while the rest of the batch still saves. An existing group that these ops leave invalid is removed and reported in removedGroups.`),
    versionName: version_metadata_1.versionNameInputSchema.describe('Short summary of what this update changes, shown in the workflow\'s version history (e.g. "Added Slack notification after HTTP request"). Always provide it.'),
    versionDescription: version_metadata_1.versionDescriptionInputSchema.describe('Longer description of what changed and why, shown in the version history alongside the version name.'),
};
const outputSchema = {
    workflowId: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
    nodeCount: zod_1.z.number().optional(),
    url: zod_1.z.string().optional(),
    appliedOperations: zod_1.z
        .number()
        .optional()
        .describe('Number of submitted operations that were applied. See skippedOperations for any that were not.'),
    autoAssignedCredentials: zod_1.z
        .array(zod_1.z.object({
        nodeName: zod_1.z.string(),
        credentialName: zod_1.z.string(),
        credentialType: zod_1.z.string(),
        source: zod_1.z.enum(['user', 'aiGateway']).optional(),
    }))
        .optional()
        .describe('Credentials auto-assigned to nodes that were added in this update.'),
    validationWarnings: zod_1.z
        .array(zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        nodeName: zod_1.z.string().optional(),
        preExisting: zod_1.z
            .boolean()
            .optional()
            .describe('True when the same warning already existed before this update — it was not caused by these operations.'),
    }))
        .optional()
        .describe('Graph and JSON validation warnings on the resulting workflow. Warnings marked preExisting (also tagged [pre-existing] in the message) were already present before this update; only self-correct the rest on the next call.'),
    skippedOperations: zod_1.z
        .array(zod_1.z.object({
        opIndex: zod_1.z.number(),
        type: zod_1.z.string(),
        reason: zod_1.z.string(),
    }))
        .optional()
        .describe('Submitted group operations that did not take effect: either invalid, or their group broke the group rules.'),
    removedGroups: zod_1.z
        .array(zod_1.z.object({
        groupName: zod_1.z.string(),
        reason: zod_1.z.string(),
    }))
        .optional()
        .describe('Existing groups this update made invalid and removed. Repair them before you report the workflow as done.'),
    settings: zod_1.z
        .record(zod_1.z.string(), zod_1.z.unknown())
        .optional()
        .describe('Resulting workflow-level settings after the update. Present only when a setWorkflowSettings operation ran. Reflects server-side cleanup (e.g. "DEFAULT" values are removed).'),
    error: zod_1.z
        .string()
        .optional()
        .describe('Error message explaining why the update failed. Present only on failure.'),
    errorCode: zod_1.z.string().optional().describe('Machine-readable error code.'),
    note: zod_1.z.string().optional(),
};
async function assertErrorWorkflowIsUsable({ errorWorkflowId, parentWorkflowId, user, workflowFinderService, errorWorkflowValidationService, }) {
    if ((0, error_workflow_validation_service_1.isExpressionErrorWorkflowId)(errorWorkflowId)) {
        throw new Error(`errorWorkflow does not accept expressions, and '${errorWorkflowId}' would be stored as a literal workflow ID that never matches, so the error workflow would never run. Pass a plain workflow ID (find one with search_workflows), or "DEFAULT" to clear it.`);
    }
    const staticId = (0, error_workflow_validation_service_1.staticErrorWorkflowId)(errorWorkflowId);
    if (!staticId)
        return;
    const errorWorkflow = await workflowFinderService.findWorkflowForUser(staticId, user, [
        'workflow:read',
    ]);
    if (errorWorkflow)
        (0, workflow_validation_utils_1.validateMcpWorkflow)(errorWorkflow);
    const problem = await errorWorkflowValidationService.findProblem({
        errorWorkflowId: staticId,
        parentWorkflowId,
        user,
    });
    if (!problem)
        return;
    switch (problem.reason) {
        case 'not-found':
            throw new Error(`Error workflow '${staticId}' was not found or you do not have access to it. Find a valid workflow ID with search_workflows, or create an error-handler workflow first.`);
        case 'not-published':
            throw new Error(`Error workflow '${problem.name}' (${staticId}) has no published version, so n8n cannot run it when this workflow fails. Publish that workflow first (publish_workflow), then set it as the error workflow.`);
        case 'no-error-trigger':
            throw new Error(`The published version of workflow '${problem.name}' (${staticId}) has no active Error Trigger node, so it would never run when this workflow fails. Add an Error Trigger node (${problem.errorTriggerType}) and publish it, pick a different error workflow, or create a new error-handler workflow.`);
        case 'caller-policy':
            throw new Error(`Error workflow '${problem.name}' (${staticId}) cannot be called by this workflow because of its caller policy, so n8n would block it at runtime. Update that workflow's settings ("This workflow can be called by …") to allow this one — set it to any workflow, or add this workflow to its allowlist — or pick a different error workflow.`);
    }
}
function assertCallerPolicyConsistent(settings) {
    if (settings?.callerPolicy !== 'workflowsFromAList') {
        return;
    }
    const callerIds = (settings.callerIds ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
    if (callerIds.length === 0) {
        throw new Error('callerPolicy "workflowsFromAList" requires callerIds — a comma-separated list of workflow IDs allowed to call this workflow. Without it, no workflow can call this one. Provide callerIds, or choose a different callerPolicy.');
    }
}
async function assertWorkflowSettingsValid({ strictOperations, settings, workflowId, }, { user, globalConfig, workflowFinderService, errorWorkflowValidationService, }) {
    const setsErrorWorkflow = strictOperations.some((op) => op.type === 'setWorkflowSettings' && op.settings.errorWorkflow !== undefined);
    if (setsErrorWorkflow) {
        await assertErrorWorkflowIsUsable({
            errorWorkflowId: settings?.errorWorkflow,
            parentWorkflowId: workflowId,
            user,
            workflowFinderService,
            errorWorkflowValidationService,
        });
    }
    const setsCallerConfig = strictOperations.some((op) => op.type === 'setWorkflowSettings' &&
        (op.settings.callerPolicy !== undefined || op.settings.callerIds !== undefined));
    if (setsCallerConfig) {
        assertCallerPolicyConsistent(settings);
    }
    const setsExecutionTimeout = strictOperations.some((op) => op.type === 'setWorkflowSettings' && op.settings.executionTimeout !== undefined);
    if (setsExecutionTimeout) {
        (0, execution_timeout_validation_1.assertExecutionTimeoutWithinMax)(settings?.executionTimeout, globalConfig.executions.maxTimeout);
    }
}
async function assertPublishAllowedForSettingsChange({ hasSettingsOperations, activeVersionId, workflowId, }, { user, workflowFinderService, }) {
    if (!hasSettingsOperations) {
        return;
    }
    if (!activeVersionId) {
        return;
    }
    if ((0, permissions_1.hasGlobalScope)(user, 'workflow:publish')) {
        return;
    }
    const canPublish = await workflowFinderService.findWorkflowHeadForUser(workflowId, user, [
        'workflow:publish',
    ]);
    if (!canPublish) {
        throw new Error('Changing settings on a published workflow reactivates it, which requires publish permission. Your account can edit but not publish this workflow. Ask the owner for publish access, or unpublish the workflow first.');
    }
}
function dedupeNamesPreservingCase(names) {
    const seen = new Set();
    const result = [];
    for (const raw of names) {
        const trimmed = raw.trim();
        if (trimmed.length === 0) {
            continue;
        }
        const key = trimmed.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(trimmed);
    }
    return result;
}
function haveSameTagNames(actualTags, expectedTagNames) {
    if (!actualTags || !expectedTagNames) {
        return false;
    }
    return (0, isEqual_1.default)(actualTags.map((tag) => tag.name).sort(), dedupeNamesPreservingCase(expectedTagNames).sort());
}
function collectTouchedNodes(operations) {
    const touched = new Map();
    const recordTouch = (name, opIndex) => {
        if (!touched.has(name)) {
            touched.set(name, opIndex);
        }
    };
    for (let i = 0; i < operations.length; i++) {
        const op = operations[i];
        if (op.type === 'addNode') {
            recordTouch(op.node.name, i);
        }
        else if (op.type === 'updateNodeParameters' || op.type === 'setNodeParameter') {
            recordTouch(op.nodeName, i);
        }
        else if (op.type === 'renameNode') {
            const idx = touched.get(op.oldName);
            if (idx !== undefined) {
                touched.delete(op.oldName);
                touched.set(op.newName, idx);
            }
        }
        else if (op.type === 'removeNode') {
            touched.delete(op.nodeName);
        }
    }
    return touched;
}
const countOperationsWithNoEffect = (skippedOperations, groupOperations) => {
    const producedPerOp = new Map();
    for (const { opIndex } of Object.values(groupOperations)) {
        producedPerOp.set(opIndex, (producedPerOp.get(opIndex) ?? 0) + 1);
    }
    const skippedPerOp = new Map();
    for (const { opIndex } of skippedOperations) {
        skippedPerOp.set(opIndex, (skippedPerOp.get(opIndex) ?? 0) + 1);
    }
    let count = 0;
    for (const [opIndex, skipped] of skippedPerOp) {
        if (skipped >= (producedPerOp.get(opIndex) ?? 0)) {
            count++;
        }
    }
    return count;
};
const isTagOperation = (op) => op.type === 'addTags' || op.type === 'removeTags';
const isSettingsOperation = (op) => op.type === 'setWorkflowSettings';
const GRAPH_NEUTRAL_OPERATIONS = new Set([
    'addTags',
    'removeTags',
    'setNodeSettings',
    'setWorkflowSettings',
    'setWorkflowMetadata',
    'addNodeGroup',
    'removeNodeGroup',
    'updateNodeGroup',
    'setNodeGroups',
    'setNodePosition',
]);
const touchesGraph = (op) => !GRAPH_NEUTRAL_OPERATIONS.has(op.type);
function assertOperationsSupported(strictOperations, { tagsDisabled }) {
    if (tagsDisabled && strictOperations.some(isTagOperation)) {
        throw new Error('Tag operations are not supported on this instance because tags are disabled.');
    }
}
function resolveNodeGroupViolations(result, nodeTypes) {
    const skippedOperations = [...result.skippedOperations];
    const removedGroups = [];
    const getNodeType = (0, workflow_helpers_1.makeGetNodeTypeForGrouping)(nodeTypes);
    const violations = [
        ...(0, workflow_helpers_1.dropInvalidWorkflowGroups)(result.workflow, getNodeType, (violation) => result.groupOperations[violation.groupId] !== undefined),
        ...(0, workflow_helpers_1.dropInvalidWorkflowGroups)(result.workflow, getNodeType),
    ];
    for (const violation of violations) {
        const requestedBy = result.groupOperations[violation.groupId];
        if (requestedBy) {
            skippedOperations.push({ ...requestedBy, reason: violation.message });
        }
        else {
            removedGroups.push({
                groupName: violation.groupName,
                reason: violation.message,
            });
        }
    }
    return {
        skippedOperations,
        removedGroups,
        nodeGroupsNeedPersisting: violations.length > 0 || result.nodeGroupsChanged,
    };
}
function buildWorkflowUpdateEntity({ workflow, existingMeta, hasSettingsOperations, hasNonTagOperations, nodeGroupsNeedPersisting, }) {
    const workflowUpdateData = new db_1.WorkflowEntity();
    Object.assign(workflowUpdateData, {
        name: workflow.name,
        ...(workflow.description !== undefined ? { description: workflow.description } : {}),
        nodes: workflow.nodes,
        connections: workflow.connections,
        ...(hasSettingsOperations ? { settings: workflow.settings } : {}),
        ...(nodeGroupsNeedPersisting ? { nodeGroups: workflow.nodeGroups } : {}),
        meta: hasNonTagOperations
            ? {
                ...(existingMeta ?? {}),
                aiBuilderAssisted: true,
                builderVariant: 'mcp',
            }
            : (existingMeta ?? {}),
    });
    return workflowUpdateData;
}
function buildUpdateTelemetryPayload({ userId, workflowId, operations, sanitizedSkillsUsed, versionName, versionDescription, }) {
    return {
        user_id: userId,
        tool_name: constants_1.MCP_UPDATE_WORKFLOW_TOOL.toolName,
        parameters: {
            workflowId,
            ...(sanitizedSkillsUsed !== undefined ? { skillsUsed: sanitizedSkillsUsed } : {}),
            opCount: operations.length,
            opTypes: operations.map((op) => op.type),
            hasVersionName: !!versionName,
            hasVersionDescription: !!versionDescription,
        },
    };
}
async function autoAssignCredentialsForAddedNodes({ workflowUpdateData, addedNodeNames, projectId, }, { user, nodeTypes, credentialsService, aiGatewayService, }) {
    if (addedNodeNames.length === 0) {
        return { assignments: [], skippedHttpNodes: [], outcomes: [] };
    }
    const addedNodeSet = new Set(addedNodeNames);
    const addedNodes = workflowUpdateData.nodes.filter((n) => addedNodeSet.has(n.name));
    return await (0, credentials_auto_assign_1.autoPopulateNodeCredentials)({ ...workflowUpdateData, nodes: addedNodes }, user, nodeTypes, credentialsService, projectId, aiGatewayService);
}
async function collectValidationWarnings(updated, existing, nodeTypes) {
    const { ParseValidateHandler, getWarningKey } = await import('@n8n/ai-workflow-builder');
    const validator = new ParseValidateHandler({
        generatePinData: false,
        nodeTypesProvider: nodeTypes,
    });
    const validate = (workflow) => validator.validateJSON({
        name: workflow.name,
        nodes: workflow.nodes,
        connections: workflow.connections,
    });
    const postUpdateWarnings = validate(updated);
    if (postUpdateWarnings.length === 0) {
        return postUpdateWarnings;
    }
    let preUpdateWarnings = [];
    try {
        preUpdateWarnings = validate(existing);
    }
    catch {
    }
    const preUpdateKeys = new Set(preUpdateWarnings.map(getWarningKey));
    return postUpdateWarnings.map((warning) => preUpdateKeys.has(getWarningKey(warning))
        ? { ...warning, message: `[pre-existing] ${warning.message}`, preExisting: true }
        : warning);
}
async function resolveTagIds(tagNames, user, tagService) {
    if (tagNames === undefined) {
        return undefined;
    }
    const uniqueTagNames = dedupeNamesPreservingCase(tagNames);
    if ((0, permissions_1.hasGlobalScope)(user, 'tag:create')) {
        const resolvedTags = await tagService.findOrCreateByNames(uniqueTagNames);
        return resolvedTags.map((t) => t.id);
    }
    const resolvedTags = await tagService.getByNames(uniqueTagNames);
    const resolvedNames = new Set(resolvedTags.map((t) => t.name));
    const missing = uniqueTagNames.filter((name) => !resolvedNames.has(name));
    if (missing.length > 0) {
        throw new Error(`Cannot apply the following tags because they don't exist and your account does not have permission to create them: ${missing.join(', ')}`);
    }
    return resolvedTags.map((t) => t.id);
}
const createUpdateWorkflowTool = (user, workflowFinderService, workflowService, urlService, telemetry, nodeTypes, credentialsService, sharedWorkflowRepository, collaborationService, dataTableOps, tagService, globalConfig, errorWorkflowValidationService, aiGatewayService, options = {}, logger, postSaveMetrics) => {
    const settingsGuardDependencies = {
        user,
        globalConfig,
        workflowFinderService,
        errorWorkflowValidationService,
    };
    return {
        name: constants_1.MCP_UPDATE_WORKFLOW_TOOL.toolName,
        config: {
            description: TOOL_DESCRIPTION,
            inputSchema,
            outputSchema,
            annotations: {
                title: constants_1.MCP_UPDATE_WORKFLOW_TOOL.displayTitle,
                readOnlyHint: false,
                destructiveHint: true,
                idempotentHint: false,
                openWorldHint: false,
            },
        },
        handler: async ({ workflowId, skillsUsed, operations, versionName, versionDescription, }) => {
            const telemetryPayload = buildUpdateTelemetryPayload({
                userId: user.id,
                workflowId,
                operations,
                sanitizedSkillsUsed: (0, skills_used_1.sanitizeSkillsUsed)(skillsUsed),
                versionName,
                versionDescription,
            });
            let updateAttempted = false;
            let hasGraphOps = false;
            let hasTagOperations = false;
            let expectedWorkflow = null;
            let expectedSettings;
            let expectedTagNames;
            let existingWorkflow = null;
            try {
                const strictOperations = parseStrictOperations(operations);
                hasTagOperations = strictOperations.some(isTagOperation);
                const hasNonTagOperations = strictOperations.some((op) => !isTagOperation(op));
                const hasSettingsOperations = strictOperations.some(isSettingsOperation);
                hasGraphOps = strictOperations.some((op) => GRAPH_OPERATION_TYPES.has(op.type));
                assertOperationsSupported(strictOperations, {
                    tagsDisabled: globalConfig.tags.disabled,
                });
                existingWorkflow = await (0, workflow_validation_utils_1.getMcpWorkflow)(workflowId, user, ['workflow:update'], workflowFinderService, { includeTags: hasTagOperations });
                await collaborationService.ensureWorkflowEditable(existingWorkflow.id);
                const result = (0, workflow_operations_1.applyOperations)((0, workflow_operations_1.toWorkflowSlice)(existingWorkflow, { includeTags: hasTagOperations }), strictOperations);
                if (!result.success) {
                    throw new Error(result.error);
                }
                const clearedInputs = [];
                for (const op of strictOperations) {
                    if (op.type === 'removeConnection') {
                        clearedInputs.push({
                            nodeName: op.target,
                            connectionType: op.connectionType ?? n8n_workflow_1.NodeConnectionTypes.Main,
                        });
                    }
                    else if (op.type === 'renameNode') {
                        for (const cleared of clearedInputs) {
                            if (cleared.nodeName === op.oldName)
                                cleared.nodeName = op.newName;
                        }
                    }
                }
                const addedSubnodeLinks = strictOperations.some(touchesGraph)
                    ? (0, workflow_sdk_1.connectRequiredSubnodeInputs)(result.workflow, nodeTypes, { clearedInputs })
                    : [];
                const { skippedOperations, removedGroups, nodeGroupsNeedPersisting } = resolveNodeGroupViolations(result, nodeTypes);
                const credentialCheck = await (0, credential_validation_1.validateCredentialReferences)(strictOperations, existingWorkflow, user, credentialsService, nodeTypes, { workflowId: existingWorkflow.id });
                if (!credentialCheck.ok) {
                    throw new Error(credentialCheck.error);
                }
                const invalidToolSourceResponse = (0, connection_structure_check_1.buildInvalidAiToolSourceErrorResponse)({ nodes: result.workflow.nodes, connections: result.workflow.connections }, nodeTypes, (errorMessage) => ({ error: errorMessage, errorCode: 'INVALID_AI_TOOL_SOURCE' }), telemetryPayload, telemetry);
                if (invalidToolSourceResponse) {
                    return invalidToolSourceResponse;
                }
                const { projectId: workflowProjectId } = await sharedWorkflowRepository.findOneOrFail({
                    where: { workflowId, role: 'workflow:owner' },
                    select: ['projectId'],
                });
                const dataTableCheck = await (0, data_table_validation_1.validateDataTableReferencesForUpdate)(result.workflow.nodes, collectTouchedNodes(strictOperations), workflowProjectId, dataTableOps);
                if (!dataTableCheck.ok) {
                    throw new Error(dataTableCheck.error);
                }
                await assertWorkflowSettingsValid({ strictOperations, settings: result.workflow.settings, workflowId }, settingsGuardDependencies);
                await assertPublishAllowedForSettingsChange({
                    hasSettingsOperations,
                    activeVersionId: existingWorkflow.activeVersionId,
                    workflowId,
                }, settingsGuardDependencies);
                const workflowUpdateData = buildWorkflowUpdateEntity({
                    workflow: result.workflow,
                    existingMeta: existingWorkflow.meta,
                    hasSettingsOperations,
                    hasNonTagOperations,
                    nodeGroupsNeedPersisting,
                });
                (0, workflow_helpers_1.resolveNodeWebhookIds)(workflowUpdateData, nodeTypes);
                const { assignments: credentialAssignments, skippedHttpNodes, outcomes: autoAssignOutcomes, } = await autoAssignCredentialsForAddedNodes({
                    workflowUpdateData,
                    addedNodeNames: result.addedNodeNames,
                    projectId: workflowProjectId,
                }, { user, nodeTypes, credentialsService, aiGatewayService });
                const validationWarnings = await collectValidationWarnings(workflowUpdateData, existingWorkflow, nodeTypes);
                for (const link of addedSubnodeLinks) {
                    validationWarnings.push((0, workflow_sdk_1.describeAddedSubnodeConnection)(link));
                }
                validationWarnings.push(...(await (0, uninstalled_node_warnings_1.buildUninstalledNodeWarnings)(workflowUpdateData.nodes.filter((node) => result.addedNodeNames.includes(node.name)), options.findUninstalledNodeTypes, options.installToolAvailable)));
                const tagIds = await resolveTagIds(result.tagNames, user, tagService);
                const versionMetadata = (0, version_metadata_1.resolveVersionMetadata)({ versionName, versionDescription }, (0, version_metadata_1.buildUpdateVersionMetadata)({ nodes: existingWorkflow.nodes, connections: existingWorkflow.connections }, { nodes: workflowUpdateData.nodes, connections: workflowUpdateData.connections }));
                expectedWorkflow = {
                    nodes: workflowUpdateData.nodes,
                    connections: workflowUpdateData.connections,
                    ...(workflowUpdateData.nodeGroups !== undefined
                        ? { nodeGroups: workflowUpdateData.nodeGroups }
                        : {}),
                };
                expectedSettings =
                    hasSettingsOperations && workflowUpdateData.settings
                        ? (0, workflow_helpers_1.removeDefaultValues)({ ...(existingWorkflow.settings ?? {}), ...workflowUpdateData.settings }, globalConfig.executions.timeout)
                        : undefined;
                expectedTagNames = result.tagNames;
                updateAttempted = true;
                const updatedWorkflow = await workflowService.update(user, workflowUpdateData, workflowId, {
                    aiBuilderAssisted: hasNonTagOperations,
                    source: 'n8n-mcp',
                    versionName: versionMetadata.name,
                    versionDescription: versionMetadata.description,
                    ...(tagIds !== undefined ? { tagIds } : {}),
                });
                const baseUrl = urlService.getInstanceBaseUrl();
                const workflowUrl = `${baseUrl}/workflow/${updatedWorkflow.id}`;
                const notAppliedCount = countOperationsWithNoEffect(skippedOperations, result.groupOperations);
                const ceilingWarning = (0, top_level_items_warning_1.topLevelItemsWarning)(updatedWorkflow);
                if (ceilingWarning) {
                    const preExistingUngroupedNodeNames = new Set((0, top_level_items_warning_1.summarizeUngroupedNodeNames)(existingWorkflow));
                    const hasNewlyAddedUngroupedNodeNames = (0, top_level_items_warning_1.summarizeUngroupedNodeNames)(updatedWorkflow).some((name) => !preExistingUngroupedNodeNames.has(name));
                    const wasOverCeilingBefore = (0, top_level_items_warning_1.topLevelItemsWarning)(existingWorkflow) !== undefined;
                    const preExisting = wasOverCeilingBefore && !hasNewlyAddedUngroupedNodeNames;
                    validationWarnings.push(preExisting
                        ? {
                            ...ceilingWarning,
                            message: `[pre-existing] ${ceilingWarning.message}`,
                            preExisting: true,
                        }
                        : ceilingWarning);
                }
                const output = {
                    workflowId: updatedWorkflow.id,
                    name: updatedWorkflow.name,
                    nodeCount: updatedWorkflow.nodes.length,
                    url: workflowUrl,
                    appliedOperations: strictOperations.length - notAppliedCount,
                    autoAssignedCredentials: credentialAssignments,
                    validationWarnings,
                    note: skippedHttpNodes.length
                        ? `HTTP Request nodes (${skippedHttpNodes.join(', ')}) were skipped during credential auto-assignment. Their credentials must be configured manually.`
                        : undefined,
                    skippedOperations: skippedOperations.length > 0 ? skippedOperations : undefined,
                    removedGroups: removedGroups.length > 0 ? removedGroups : undefined,
                    settings: hasSettingsOperations
                        ? (updatedWorkflow.settings ?? {})
                        : undefined,
                };
                try {
                    if (autoAssignOutcomes.length > 0) {
                        const nodeTypesByName = new Map(updatedWorkflow.nodes.map((n) => [n.name, n.type]));
                        (0, credentials_auto_assign_1.trackAutoassignOutcomes)(telemetry, user.id, 'update_workflow', autoAssignOutcomes, nodeTypesByName, workflowId);
                    }
                    void collaborationService.broadcastWorkflowUpdate(workflowId, user.id).catch(() => { });
                    telemetryPayload.results = {
                        success: true,
                        data: {
                            workflowId: updatedWorkflow.id,
                            nodeCount: updatedWorkflow.nodes.length,
                        },
                    };
                    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                }
                catch (sideEffectError) {
                    logger.error('Post-save side effect failed for update_workflow', {
                        workflowId: updatedWorkflow.id,
                        error: sideEffectError,
                    });
                    postSaveMetrics.incrementPostSaveFailure('update', sideEffectError);
                }
                return {
                    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                };
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                const errorCode = (0, error_code_utils_1.getErrorCode)(error);
                if (updateAttempted && existingWorkflow) {
                    let persisted = null;
                    try {
                        persisted = await workflowFinderService.findWorkflowForUser(workflowId, user, ['workflow:read'], { includeTags: hasTagOperations });
                    }
                    catch (lookupError) {
                        logger.warn('Post-update verification lookup failed', {
                            workflowId,
                            error: lookupError,
                        });
                    }
                    const matchesExpected = persisted &&
                        expectedWorkflow &&
                        (0, isEqual_1.default)(normalize(persisted.nodes), normalize(expectedWorkflow.nodes)) &&
                        (0, isEqual_1.default)(normalize(persisted.connections), normalize(expectedWorkflow.connections)) &&
                        (expectedWorkflow.nodeGroups === undefined ||
                            (0, isEqual_1.default)(normalize(persisted.nodeGroups), normalize(expectedWorkflow.nodeGroups)));
                    const contentChanged = !(0, isEqual_1.default)(normalize(existingWorkflow.nodes), normalize(expectedWorkflow?.nodes)) ||
                        !(0, isEqual_1.default)(normalize(existingWorkflow.connections), normalize(expectedWorkflow?.connections)) ||
                        (expectedWorkflow?.nodeGroups !== undefined &&
                            !(0, isEqual_1.default)(normalize(existingWorkflow.nodeGroups), normalize(expectedWorkflow.nodeGroups)));
                    const existingUpdatedAt = existingWorkflow.updatedAt
                        ? new Date(existingWorkflow.updatedAt).getTime()
                        : undefined;
                    const persistedUpdatedAt = persisted?.updatedAt
                        ? new Date(persisted.updatedAt).getTime()
                        : undefined;
                    const hasNewerTimestamp = existingUpdatedAt !== undefined &&
                        persistedUpdatedAt !== undefined &&
                        persistedUpdatedAt > existingUpdatedAt;
                    const hasPersistedExpectedSettings = expectedSettings !== undefined &&
                        persisted &&
                        (0, isEqual_1.default)(normalize(persisted.settings), normalize(expectedSettings)) &&
                        !(0, isEqual_1.default)(normalize(existingWorkflow.settings), normalize(expectedSettings));
                    const wasTouched = Boolean(hasNewerTimestamp || hasPersistedExpectedSettings);
                    const tagsMatchExpected = !hasTagOperations || haveSameTagNames(persisted?.tags, expectedTagNames);
                    const recovered = tagsMatchExpected &&
                        (hasGraphOps
                            ? Boolean(matchesExpected) && (contentChanged || hasNewerTimestamp)
                            : wasTouched);
                    if (persisted && recovered) {
                        const baseUrl = urlService.getInstanceBaseUrl();
                        const workflowUrl = `${baseUrl}/workflow/${persisted.id}`;
                        try {
                            telemetryPayload.results = {
                                success: true,
                                data: {
                                    workflowId: persisted.id,
                                    nodeCount: persisted.nodes.length,
                                    postSaveError: errorMessage,
                                },
                            };
                            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                        }
                        catch (telemetryError) {
                            logger.error('Post-save telemetry failed for update_workflow (recovery path)', {
                                workflowId: persisted.id,
                                error: telemetryError,
                            });
                            postSaveMetrics.incrementPostSaveFailure('update', telemetryError);
                        }
                        const output = {
                            workflowId: persisted.id,
                            name: persisted.name,
                            nodeCount: persisted.nodes.length,
                            url: workflowUrl,
                            note: `Workflow was updated successfully, but a post-save operation failed: ${errorMessage}`,
                        };
                        postSaveMetrics.incrementPostSaveFailure('update', error);
                        return {
                            content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                            structuredContent: output,
                        };
                    }
                }
                try {
                    telemetryPayload.results = {
                        success: false,
                        error: errorMessage,
                    };
                    telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                }
                catch (telemetryError) {
                    logger.error('Telemetry failed for update_workflow (error path)', {
                        error: telemetryError,
                    });
                }
                const output = {
                    error: errorMessage,
                    errorCode,
                };
                return {
                    content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                    structuredContent: output,
                    isError: true,
                };
            }
        },
    };
};
exports.createUpdateWorkflowTool = createUpdateWorkflowTool;
//# sourceMappingURL=update-workflow.tool.js.map