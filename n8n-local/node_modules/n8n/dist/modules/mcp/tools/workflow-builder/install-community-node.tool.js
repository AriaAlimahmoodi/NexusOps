"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInstallCommunityNodeTool = void 0;
const permissions_1 = require("@n8n/permissions");
const zod_1 = __importDefault(require("zod"));
const mcp_constants_1 = require("../../mcp.constants");
const inputSchema = {
    nodeType: zod_1.default
        .string()
        .min(1)
        .describe('Full node type of a verified community node reported by search_nodes as not installed, e.g. "@mendable/n8n-nodes-firecrawl.firecrawl". The package that ships it is installed.'),
};
const outputSchema = {
    installed: zod_1.default.boolean().describe('Whether the package was installed by this call'),
    alreadyInstalled: zod_1.default
        .boolean()
        .optional()
        .describe('True when the node was already available, so nothing was installed. Not an error: carry on and use the node.'),
    packageName: zod_1.default.string().describe('npm package that was installed'),
    nodeTypes: zod_1.default
        .array(zod_1.default.string())
        .describe('Node types the package registered, now usable in workflow code. Call get_node_types on these before writing the workflow — the installed definition is authoritative.'),
    version: zod_1.default.string().optional().describe('Exact version installed'),
    credentialTypes: zod_1.default
        .array(zod_1.default.string())
        .optional()
        .describe('Credential types the installed nodes require. These only exist now that the package is installed, so the user must create one in n8n before the workflow can run. Tell them which.'),
};
function credentialTypesOf(nodeTypeNames, nodeTypes) {
    const types = new Set();
    for (const name of nodeTypeNames) {
        try {
            for (const credential of nodeTypes.getByNameAndVersion(name).description.credentials ?? []) {
                types.add(credential.name);
            }
        }
        catch {
        }
    }
    return [...types];
}
const createInstallCommunityNodeTool = (user, communityNodeTypesService, communityPackagesLifecycleService, nodeTypes, telemetry) => ({
    name: mcp_constants_1.INSTALL_COMMUNITY_NODE_TOOL.toolName,
    config: {
        description: 'Install a verified community node package that search_nodes reported as not installed on this instance. Installs code onto the n8n instance, so confirm with the user before calling it. Only packages vetted by n8n can be installed, at the version the registry publishes. After installing, call get_node_types for the returned node types before writing workflow code.',
        inputSchema,
        outputSchema,
        annotations: {
            title: mcp_constants_1.INSTALL_COMMUNITY_NODE_TOOL.displayTitle,
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
        },
    },
    handler: async ({ nodeType }) => {
        const telemetryPayload = {
            user_id: user.id,
            tool_name: mcp_constants_1.INSTALL_COMMUNITY_NODE_TOOL.toolName,
            parameters: { nodeType },
        };
        const fail = (error, hint) => {
            telemetryPayload.results = { success: false, error };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                isError: true,
                content: [
                    { type: 'text', text: JSON.stringify({ error, ...(hint ? { hint } : {}) }) },
                ],
            };
        };
        try {
            if (!(0, permissions_1.hasGlobalScope)(user, 'communityPackage:install')) {
                return fail('You do not have permission to install community nodes on this instance.', 'Ask an instance owner or admin to install it, or build the workflow with an HTTP Request node instead.');
            }
            const catalogEntry = await communityNodeTypesService.findVettedNodeType(nodeType);
            if (!catalogEntry) {
                return fail(`'${nodeType}' is not a node type in the verified community catalog, so it cannot be installed.`, 'Pass a node type exactly as search_nodes reported it under "not installed on this instance".');
            }
            const packageName = catalogEntry.packageName;
            if (!catalogEntry.isOfficialNode) {
                return fail(`'${nodeType}' is not an official verified node, so it cannot be installed.`, 'Use search_nodes to find an official alternative, or use an HTTP Request node.');
            }
            if (catalogEntry.isInstalled) {
                const credentialTypes = credentialTypesOf([nodeType], nodeTypes);
                const payload = {
                    installed: false,
                    alreadyInstalled: true,
                    packageName,
                    nodeTypes: [nodeType],
                    ...(credentialTypes.length > 0 ? { credentialTypes } : {}),
                };
                telemetryPayload.results = {
                    success: true,
                    data: { packageName, alreadyInstalled: true },
                };
                telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
                return {
                    content: [{ type: 'text', text: JSON.stringify(payload) }],
                    structuredContent: payload,
                };
            }
            let installedPackage;
            try {
                installedPackage = await communityPackagesLifecycleService.install({ name: packageName }, user, 'mcp');
            }
            catch (error) {
                const errorType = error instanceof Error ? error.constructor.name : typeof error;
                return fail(`Installing '${packageName}' failed (${errorType}).`, 'Report this to the user rather than retrying. If the instance manages community packages through environment variables, or the package is blocked, no retry will succeed.');
            }
            const installedNodeTypes = installedPackage.installedNodes.map((node) => node.type);
            const credentialTypes = credentialTypesOf(installedNodeTypes, nodeTypes);
            const payload = {
                installed: true,
                packageName: installedPackage.packageName,
                version: installedPackage.installedVersion,
                nodeTypes: installedNodeTypes,
                ...(credentialTypes.length > 0 ? { credentialTypes } : {}),
            };
            telemetryPayload.results = {
                success: true,
                data: { packageName: payload.packageName, nodeCount: installedNodeTypes.length },
            };
            telemetry.track(mcp_constants_1.USER_CALLED_MCP_TOOL_EVENT, telemetryPayload);
            return {
                content: [{ type: 'text', text: JSON.stringify(payload) }],
                structuredContent: payload,
            };
        }
        catch (error) {
            const errorType = error instanceof Error ? error.constructor.name : typeof error;
            return fail(`Could not reach the verified community node catalog (${errorType}).`, 'This may be transient. Retry once, and if it fails again tell the user and build with an HTTP Request node instead.');
        }
    },
});
exports.createInstallCommunityNodeTool = createInstallCommunityNodeTool;
//# sourceMappingURL=install-community-node.tool.js.map