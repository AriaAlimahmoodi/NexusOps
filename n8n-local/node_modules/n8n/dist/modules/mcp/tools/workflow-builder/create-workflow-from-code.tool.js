"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCreateWorkflowFromCodeTool = void 0;
const db_1 = require("@n8n/db");
const zod_1 = __importDefault(require("zod"));
const connection_structure_check_1 = require("./connection-structure-check");
const constants_1 = require("./constants");
const credential_validation_1 = require("./credential-validation");
const credentials_auto_assign_1 = require("./credentials-auto-assign");
const data_table_validation_1 = require("./data-table-validation");
const error_code_utils_1 = require("./error-code.utils");
const skills_used_1 = require("./skills-used");
const top_level_items_warning_1 = require("./top-level-items-warning");
const version_metadata_1 = require("./version-metadata");
const uninstalled_node_warnings_1 = require("./uninstalled-node-warnings");
const mcp_constants_1 = require("../../mcp.constants");
const workflow_validation_utils_1 = require("../workflow-validation.utils");
const errors_1 = require("@n8n/errors");
const workflow_helpers_1 = require("../../../../workflow-helpers");
const MAX_WORKFLOW_DESCRIPTION_LENGTH = 255;
function normalizeWorkflowDescription(description) {
    if (!description)
        return { description: undefined, truncated: false };
    if (description.length <= MAX_WORKFLOW_DESCRIPTION_LENGTH) {
        return { description, truncated: false };
    }
    return {
        description: description.slice(0, MAX_WORKFLOW_DESCRIPTION_LENGTH),
        truncated: true,
    };
}
const inputSchema = {
    code: zod_1.default
        .string()
        .max(constants_1.MAX_WORKFLOW_CODE_LENGTH)
        .describe(`Full TypeScript/JavaScript workflow code using the n8n Workflow SDK. Must be validated first with ${constants_1.CODE_BUILDER_VALIDATE_TOOL.toolName}. Max ${constants_1.MAX_WORKFLOW_CODE_LENGTH} characters.`),
    skillsUsed: zod_1.default.array(zod_1.default.string()).optional().describe(skills_used_1.SKILLS_USED_PARAM_DESCRIPTION),
    name: zod_1.default
        .string()
        .max(128)
        .optional()
        .describe('Optional workflow name. If not provided, uses the name from the code.'),
    description: zod_1.default
        .string()
        .optional()
        .describe('Workflow description. Longer text is shortened to 255 chars before saving.'),
    versionName: version_metadata_1.versionNameInputSchema.describe('Short summary of this initial version, shown in the workflow\'s version history (e.g. "Initial Slack notification workflow"). Always provide it.'),
    versionDescription: version_metadata_1.versionDescriptionInputSchema.describe('Longer description of what this version does, shown in the version history alongside the version name.'),
    projectId: zod_1.default
        .string()
        .optional()
        .describe("Project ID to create the workflow in. If the user named a project (e.g. 'in my Marketing project'), you MUST call search_projects first to resolve the name to an ID and pass it here — do not guess. If search_projects returns multiple partial matches with no exact match, ask the user to clarify before creating the workflow. Only omit this field when the user did not mention a project at all; in that case it defaults to the user's personal project."),
    folderId: zod_1.default
        .string()
        .optional()
        .describe('Optional folder ID to create the workflow in. Requires projectId to be set. Use search_folders to find a folder by name within a project; when multiple folders match the name, ask the user which one they meant before creating.'),
};
const outputSchema = {
    workflowId: zod_1.default.string().optional().describe('The ID of the created workflow'),
    name: zod_1.default.string().optional().describe('The name of the created workflow'),
    nodeCount: zod_1.default.number().optional().describe('The number of nodes in the workflow'),
    url: zod_1.default.string().optional().describe('The URL to open the workflow in n8n'),
    autoAssignedCredentials: zod_1.default
        .array(zod_1.default.object({
        nodeName: zod_1.default.string().describe('The name of the node that had credentials auto-assigned'),
        credentialName: zod_1.default.string().describe('The name of the credential that was auto-assigned'),
        credentialType: zod_1.default.string().describe('The credential type that was auto-assigned'),
        source: zod_1.default
            .enum(['user', 'aiGateway'])
            .optional()
            .describe('Where the credential came from: "user" for an existing user credential, "aiGateway" for a credential managed via Gateway credits.'),
    }))
        .optional()
        .describe('List of credentials that were automatically assigned to nodes'),
    targetProject: zod_1.default
        .object({
        id: zod_1.default.string().describe('The ID of the project the workflow was created in'),
        name: zod_1.default.string().describe('The display name of the project the workflow was created in'),
        type: zod_1.default
            .enum(['personal', 'team'])
            .describe('Whether the workflow landed in a personal or team project'),
    })
        .optional()
        .describe('The project the workflow was actually created in.'),
    targetFolder: zod_1.default
        .object({
        id: zod_1.default.string().describe('The ID of the folder the workflow was created in'),
        name: zod_1.default.string().describe('The name of the folder the workflow was created in'),
    })
        .optional()
        .describe('The folder the workflow was created in. Absent when the workflow was created at the project root.'),
    note: zod_1.default
        .string()
        .optional()
        .describe('Additional notes about the workflow creation, such as any nodes that were skipped during credential auto-assignment.'),
    skippedGroups: zod_1.default
        .array(zod_1.default.object({
        groupName: zod_1.default.string(),
        reason: zod_1.default.string(),
    }))
        .optional()
        .describe('Node groups that were invalid and skipped instead of failing the whole creation. Repair them with update_workflow before you report the workflow as done.'),
    hint: zod_1.default
        .string()
        .optional()
        .describe('Actionable hint for recovering from the error. When present, follow the suggested action before retrying.'),
    warnings: zod_1.default
        .array(zod_1.default.object({
        code: zod_1.default.string().describe('The warning code identifying the type of warning'),
        message: zod_1.default.string().describe('The warning message'),
        nodeName: zod_1.default.string().optional().describe('The node that triggered the warning'),
        parameterPath: zod_1.default
            .string()
            .optional()
            .describe('The parameter path that triggered the warning'),
    }))
        .optional()
        .describe('Validation warnings emitted while parsing the submitted code. Surface these to the user so they can correct the workflow.'),
    error: zod_1.default
        .string()
        .optional()
        .describe('Error message explaining why the creation failed. Present only on failure.'),
    errorCode: zod_1.default
        .string()
        .optional()
        .describe('Machine-readable error code. Present only on failure.'),
};
async function recoverPersistedCreate({ newWorkflow, landingProject, user, workflowFinderService, urlService, telemetry, telemetryPayload, error, logger, postSaveMetrics, }) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (!newWorkflow?.id)
        return undefined;
    let persisted = null;
    try {
        persisted = await workflowFinderService.findWorkflowForUser(newWorkflow.id, user, ['workflow:read'], { includeParentFolder: true });
    }
    catch (lookupError) {
        logger.warn('Post-create verification lookup failed', {
            workflowId: newWorkflow.id,
            error: lookupError,
        });
    }
    if (!persisted || !landingProject)
        return undefined;
    const baseUrl = urlService.getInstanceBaseUrl();
    const workflowUrl = `${baseUrl}/workflow/${persisted.id}`;
    postSaveMetrics.incrementPostSaveFailure('create', error);
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
        logger.error('Post-save telemetry failed for create_workflow_from_code (recovery path)', {
            workflowId: persisted.id,
            error: telemetryError,
        });
        postSaveMetrics.incrementPostSaveFailure('create', telemetryError);
    }
    const output = {
        workflowId: persisted.id,
        name: persisted.name,
        nodeCount: persisted.nodes.length,
        url: workflowUrl,
        autoAssignedCredentials: [],
        targetProject: {
            id: landingProject.id,
            name: landingProject.name,
            type: landingProject.type,
        },
        targetFolder: persisted.parentFolder
            ? { id: persisted.parentFolder.id, name: persisted.parentFolder.name }
            : undefined,
        note: `Workflow was created successfully, but a post-save operation failed: ${errorMessage}`,
    };
    return {
        content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
    };
}
const createCreateWorkflowFromCodeTool = (user, workflowCreationService, workflowFinderService, urlService, telemetry, nodeTypes, credentialsService, projectRepository, dataTableOps, aiGatewayService, options = {}, logger, postSaveMetrics) => ({
    name: constants_1.MCP_CREATE_WORKFLOW_FROM_CODE_TOOL.toolName,
    config: {
        description: `Create a workflow in n8n from validated SDK code. This tool expects code that already follows the n8n Workflow SDK patterns and has passed ${constants_1.CODE_BUILDER_VALIDATE_TOOL.toolName}. If code fails to parse, call get_workflow_sdk_reference, rewrite the code using the reference, validate again, then retry creation. If the user named a target project, resolve it via search_projects before calling this tool; when projectId is omitted, the workflow is created in the user's personal project. If the user named a target folder, resolve it via search_folders. If you used n8n skills while preparing this workflow, pass their identifiers in skillsUsed. After creation, always tell the user which project — and folder, if any — the workflow landed in (see the targetProject and targetFolder fields in the response).`,
        inputSchema,
        outputSchema,
        annotations: {
            title: constants_1.MCP_CREATE_WORKFLOW_FROM_CODE_TOOL.displayTitle,
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: false,
            openWorldHint: false,
        },
    },
    handler: async ({ code, skillsUsed, name, description, versionName, versionDescription, projectId, folderId, }) => {
        const sanitizedSkillsUsed = (0, skills_used_1.sanitizeSkillsUsed)(skillsUsed);
        const telemetryPayload = {
            user_id: user.id,
            tool_name: constants_1.MCP_CREATE_WORKFLOW_FROM_CODE_TOOL.toolName,
            parameters: {
                codeLength: code.length,
                ...(sanitizedSkillsUsed !== undefined ? { skillsUsed: sanitizedSkillsUsed } : {}),
                hasName: !!name,
                hasProjectId: !!projectId,
                hasFolderId: !!folderId,
                hasVersionName: !!versionName,
                hasVersionDescription: !!versionDescription,
            },
        };
        if (folderId && !projectId) {
            const errorMessage = 'projectId is required when folderId is provided';
            telemetryPayload.results = { success: false, error: errorMessage };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            const output = { error: errorMessage, errorCode: 'MISSING_PROJECT_ID' };
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
                isError: true,
            };
        }
        let newWorkflow;
        let landingProject = null;
        let landingFolder = null;
        try {
            const { ParseValidateHandler, stripImportStatements } = await import('@n8n/ai-workflow-builder');
            const handler = new ParseValidateHandler({
                generatePinData: false,
                nodeTypesProvider: nodeTypes,
            });
            const strippedCode = stripImportStatements(code);
            const result = await handler.parseAndValidate(strippedCode);
            const workflowJson = result.workflow;
            const { description: workflowDescription, truncated: descriptionTruncated } = normalizeWorkflowDescription(description);
            const invalidToolSourceResponse = (0, connection_structure_check_1.buildInvalidAiToolSourceErrorResponse)(workflowJson, nodeTypes, (errorMessage) => ({ error: errorMessage }), telemetryPayload, telemetry);
            if (invalidToolSourceResponse)
                return invalidToolSourceResponse;
            newWorkflow = new db_1.WorkflowEntity();
            Object.assign(newWorkflow, {
                name: name ?? workflowJson.name ?? 'Untitled Workflow',
                ...(workflowDescription ? { description: workflowDescription } : {}),
                nodes: workflowJson.nodes,
                connections: workflowJson.connections,
                nodeGroups: workflowJson.nodeGroups ?? [],
                settings: { ...workflowJson.settings, executionOrder: 'v1', availableInMCP: true },
                pinData: workflowJson.pinData,
                meta: { ...workflowJson.meta, aiBuilderAssisted: true, builderVariant: 'mcp' },
            });
            (0, workflow_helpers_1.resolveNodeWebhookIds)(newWorkflow, nodeTypes);
            (0, credentials_auto_assign_1.stripNullCredentialStubs)(newWorkflow.nodes);
            const skippedGroups = (0, workflow_helpers_1.dropInvalidWorkflowGroups)(newWorkflow, (0, workflow_helpers_1.makeGetNodeTypeForGrouping)(nodeTypes)).map((violation) => ({ groupName: violation.groupName, reason: violation.message }));
            landingProject = projectId
                ? await projectRepository.findOneBy({ id: projectId })
                : await projectRepository.getPersonalProjectForUserOrFail(user.id);
            if (!landingProject) {
                throw new errors_1.NotFoundError(`Project with id "${projectId}" was not found. Use search_projects to look up a valid project id.`);
            }
            const effectiveProjectId = landingProject.id;
            const dataTableCheck = await (0, data_table_validation_1.validateDataTableReferencesForWorkflow)(newWorkflow.nodes, effectiveProjectId, dataTableOps);
            if (!dataTableCheck.ok) {
                throw new Error(dataTableCheck.error);
            }
            const { assignments: credentialAssignments, skippedHttpNodes, outcomes: autoAssignOutcomes, } = await (0, credentials_auto_assign_1.autoPopulateNodeCredentials)(newWorkflow, user, nodeTypes, credentialsService, effectiveProjectId, aiGatewayService);
            const credentialCheck = await (0, credential_validation_1.validateWorkflowCredentialReferences)(newWorkflow.nodes, user, credentialsService, nodeTypes, effectiveProjectId);
            if (!credentialCheck.ok) {
                throw new Error(credentialCheck.error);
            }
            const versionMetadata = (0, version_metadata_1.resolveVersionMetadata)({ versionName, versionDescription }, (0, version_metadata_1.buildCreateVersionMetadata)(newWorkflow.nodes));
            const savedWorkflow = await workflowCreationService.createWorkflow(user, newWorkflow, {
                projectId: effectiveProjectId,
                parentFolderId: folderId,
                source: 'n8n-mcp',
                versionName: versionMetadata.name,
                versionDescription: versionMetadata.description,
            });
            landingFolder = savedWorkflow.parentFolder ?? null;
            const baseUrl = urlService.getInstanceBaseUrl();
            const workflowUrl = `${baseUrl}/workflow/${savedWorkflow.id}`;
            const notes = [
                descriptionTruncated
                    ? `Workflow description was shortened to ${MAX_WORKFLOW_DESCRIPTION_LENGTH} characters.`
                    : undefined,
                skippedHttpNodes.length
                    ? `HTTP Request nodes (${skippedHttpNodes.join(', ')}) were skipped during credential auto-assignment. Their credentials must be configured manually.`
                    : undefined,
            ].filter((note) => note !== undefined);
            const baseOutput = {
                workflowId: savedWorkflow.id,
                name: savedWorkflow.name,
                nodeCount: savedWorkflow.nodes.length,
                url: workflowUrl,
                autoAssignedCredentials: credentialAssignments,
                targetProject: {
                    id: landingProject.id,
                    name: landingProject.name,
                    type: landingProject.type,
                },
                targetFolder: landingFolder
                    ? { id: landingFolder.id, name: landingFolder.name }
                    : undefined,
                note: notes.length ? notes.join(' ') : undefined,
                skippedGroups: skippedGroups.length > 0 ? skippedGroups : undefined,
            };
            const ceilingWarning = (0, top_level_items_warning_1.topLevelItemsWarning)(savedWorkflow);
            const uninstalledWarnings = await (0, uninstalled_node_warnings_1.buildUninstalledNodeWarnings)(savedWorkflow.nodes, options.findUninstalledNodeTypes, options.installToolAvailable);
            const warnings = [
                ...result.warnings,
                ...(ceilingWarning ? [ceilingWarning] : []),
                ...uninstalledWarnings,
            ];
            const output = warnings.length > 0 ? { ...baseOutput, warnings } : baseOutput;
            try {
                const nodeTypesByName = new Map(savedWorkflow.nodes.map((n) => [n.name, n.type]));
                (0, credentials_auto_assign_1.trackAutoassignOutcomes)(telemetry, user.id, 'create_workflow_from_code', autoAssignOutcomes, nodeTypesByName, savedWorkflow.id);
                telemetryPayload.results = {
                    success: true,
                    data: {
                        workflowId: savedWorkflow.id,
                        nodeCount: savedWorkflow.nodes.length,
                        groupCount: workflowJson.nodeGroups?.length ?? 0,
                    },
                };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            }
            catch (sideEffectError) {
                logger.error('Post-save side effect failed for create_workflow_from_code', {
                    workflowId: savedWorkflow.id,
                    error: sideEffectError,
                });
                postSaveMetrics.incrementPostSaveFailure('create', sideEffectError);
            }
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const errorCode = (0, error_code_utils_1.getErrorCode)(error);
            const recoveredCreate = await recoverPersistedCreate({
                newWorkflow,
                landingProject,
                user,
                workflowFinderService,
                urlService,
                telemetry,
                telemetryPayload,
                error,
                logger,
                postSaveMetrics,
            });
            if (recoveredCreate)
                return recoveredCreate;
            try {
                telemetryPayload.results = {
                    success: false,
                    error: errorMessage,
                };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            }
            catch (telemetryError) {
                logger.error('Telemetry failed for create_workflow_from_code (error path)', {
                    error: telemetryError,
                });
            }
            const hint = (0, workflow_validation_utils_1.getSdkReferenceHint)(error, {
                afterReference: `Rewrite the code, call ${constants_1.CODE_BUILDER_VALIDATE_TOOL.toolName} until it returns valid=true, then call ${constants_1.MCP_CREATE_WORKFLOW_FROM_CODE_TOOL.toolName} again.`,
            });
            const output = {
                error: errorMessage,
                errorCode,
                ...(hint ? { hint } : {}),
            };
            return {
                content: [{ type: 'text', text: JSON.stringify(output, null, 2) }],
                structuredContent: output,
                isError: true,
            };
        }
    },
});
exports.createCreateWorkflowFromCodeTool = createCreateWorkflowFromCodeTool;
//# sourceMappingURL=create-workflow-from-code.tool.js.map