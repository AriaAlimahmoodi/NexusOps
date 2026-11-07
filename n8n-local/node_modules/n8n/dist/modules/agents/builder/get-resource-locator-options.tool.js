"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveResourceLocatorOptions = resolveResourceLocatorOptions;
exports.buildGetResourceLocatorOptionsTool = buildGetResourceLocatorOptionsTool;
const api_types_1 = require("@n8n/api-types");
const tool_1 = require("@n8n/agents/tool");
const node_catalog_1 = require("@n8n/ai-utilities/node-catalog");
const zod_1 = require("zod");
const workflow_execute_additional_data_1 = require("../../../workflow-execute-additional-data");
const builder_tool_names_1 = require("./builder-tool-names");
const nodeCredentialSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
});
const getResourceLocatorOptionsInputSchema = zod_1.z.object({
    nodeType: zod_1.z.string().describe('Tool node type identifier from agent_builder_search_nodes'),
    nodeTypeVersion: zod_1.z.number().describe('Tool node type version from agent_builder_search_nodes'),
    parameterPath: zod_1.z
        .string()
        .describe('Parameter path to resolve, e.g. "teamId", "calendarId", or "additionalFields.teamId"'),
    nodeParameters: zod_1.z
        .record(zod_1.z.unknown())
        .optional()
        .describe('Current static nodeParameters for the node, including resource/operation/mode selections and any dependency fields already resolved.'),
    credentials: zod_1.z
        .record(nodeCredentialSchema)
        .optional()
        .describe('Node credentials map returned by agent_builder_ask_credential. Do not copy from agent_builder_list_credentials.'),
    filter: zod_1.z.string().optional().describe('Optional search string to narrow the returned options'),
    paginationToken: zod_1.z
        .string()
        .optional()
        .describe('Optional pagination token from a previous lookup'),
});
async function resolveResourceLocatorOptions({ nodeType, nodeTypeVersion, parameterPath, nodeParameters, credentials, filter, paginationToken, }, deps) {
    let nodeTypeDescription;
    try {
        nodeTypeDescription = deps.nodeTypes.getByNameAndVersion(nodeType, nodeTypeVersion);
    }
    catch (error) {
        return {
            ok: false,
            code: 'node_type_not_found',
            message: error instanceof Error ? error.message : `Node type "${nodeType}" not found`,
        };
    }
    const property = (0, node_catalog_1.findNodeParameterProperty)(nodeTypeDescription.description.properties, parameterPath);
    if (!property) {
        return {
            ok: false,
            code: 'parameter_not_found',
            message: `Parameter "${parameterPath}" was not found on ${nodeType}.`,
            dynamicParameters: (0, node_catalog_1.collectDynamicNodeParameterPaths)(nodeTypeDescription.description.properties),
        };
    }
    const lookup = (0, node_catalog_1.getDynamicNodeParameterLookup)(property);
    if (!lookup) {
        return {
            ok: false,
            code: 'not_dynamic_selector',
            message: `Parameter "${parameterPath}" does not expose a resource locator or load-options lookup.`,
            dynamicParameters: (0, node_catalog_1.collectDynamicNodeParameterPaths)(nodeTypeDescription.description.properties),
        };
    }
    const credentialSlots = (0, node_catalog_1.getRequiredNodeCredentialSlots)(nodeTypeDescription.description);
    if (credentialSlots.length > 0 &&
        !lookup.skipCredentialsCheck &&
        !(0, node_catalog_1.hasNodeCredentials)(credentials)) {
        return {
            ok: false,
            code: 'missing_credentials',
            message: 'This parameter needs node credentials before live options can be fetched. Call agent_builder_ask_credential for one of the returned credential slots, then retry with the returned credentials map.',
            credentialSlots,
        };
    }
    const currentNodeParameters = (nodeParameters ?? {});
    const resourceIds = { projectId: deps.projectId, credentials };
    await deps.dynamicNodeParametersService.refineResourceIds(deps.user, resourceIds);
    if (!currentNodeParameters.authentication && resourceIds.credentials) {
        for (const credentialType of Object.keys(resourceIds.credentials)) {
            const authValue = (0, node_catalog_1.detectAuthenticationParameterValue)(nodeTypeDescription.description, credentialType);
            if (authValue !== undefined) {
                currentNodeParameters.authentication = authValue;
                break;
            }
        }
    }
    const builderHint = property.builderHint?.propertyHint;
    const additionalData = await (0, workflow_execute_additional_data_1.getBase)({
        userId: deps.user.id,
        projectId: resourceIds.projectId,
        currentNodeParameters,
    });
    additionalData.dataTableProjectId = resourceIds.projectId;
    const nodeTypeAndVersion = { name: nodeType, version: nodeTypeVersion };
    const dynamicPath = (0, node_catalog_1.toDynamicParameterPath)(parameterPath);
    try {
        if (lookup.kind === 'resourceLocator') {
            const result = await deps.dynamicNodeParametersService.getResourceLocatorResults(lookup.methodName, dynamicPath, additionalData, nodeTypeAndVersion, currentNodeParameters, resourceIds.credentials, filter, paginationToken);
            return {
                ok: true,
                kind: lookup.kind,
                parameterPath: (0, node_catalog_1.normalizeParameterPath)(parameterPath),
                methodName: lookup.methodName,
                mode: lookup.mode,
                results: (result.results ?? []).map((option) => ({
                    name: option.name,
                    value: option.value,
                    ...(option.url ? { url: option.url } : {}),
                    parameterValue: (0, node_catalog_1.toResourceLocatorParameterValue)(option, lookup.mode),
                })),
                paginationToken: result.paginationToken,
                ...(builderHint ? { builderHint } : {}),
            };
        }
        const options = lookup.kind === 'loadOptionsMethod'
            ? await deps.dynamicNodeParametersService.getOptionsViaMethodName(lookup.methodName, dynamicPath, additionalData, nodeTypeAndVersion, currentNodeParameters, resourceIds.credentials)
            : await deps.dynamicNodeParametersService.getOptionsViaLoadOptions(lookup.loadOptions, additionalData, nodeTypeAndVersion, currentNodeParameters, resourceIds.credentials);
        return {
            ok: true,
            kind: lookup.kind,
            parameterPath: (0, node_catalog_1.normalizeParameterPath)(parameterPath),
            ...(lookup.kind === 'loadOptionsMethod' ? { methodName: lookup.methodName } : {}),
            results: options.map((option) => ({
                name: option.name,
                value: option.value,
                ...(option.description ? { description: option.description } : {}),
                parameterValue: (0, node_catalog_1.toLoadedOptionParameterValue)(option),
            })),
            ...(builderHint ? { builderHint } : {}),
        };
    }
    catch (error) {
        return {
            ok: false,
            code: 'lookup_failed',
            message: error instanceof Error ? error.message : 'Failed to fetch parameter options',
        };
    }
}
function buildGetResourceLocatorOptionsTool(deps) {
    return new tool_1.Tool(builder_tool_names_1.BUILDER_TOOLS.GET_RESOURCE_LOCATOR_OPTIONS)
        .legacyNames(...(0, api_types_1.getLegacyBuilderToolNames)(builder_tool_names_1.BUILDER_TOOLS.GET_RESOURCE_LOCATOR_OPTIONS))
        .description('Fetch live options for a node parameter that is configured through a resourceLocator, loadOptionsMethod, or loadOptions routing. ' +
        'Use this for stable IDs such as Linear teamId, Slack channel, calendar, project, board, model, database, or table selectors before writing nodeParameters. ' +
        'Call agent_builder_ask_credential first when the node needs credentials, then pass the returned credentials map. ' +
        'The response includes parameterValue for each result; write that exact value into nodeParameters instead of using $fromAI for stable resource IDs.')
        .input(getResourceLocatorOptionsInputSchema)
        .handler(async (input) => await resolveResourceLocatorOptions(input, deps))
        .build();
}
//# sourceMappingURL=get-resource-locator-options.tool.js.map