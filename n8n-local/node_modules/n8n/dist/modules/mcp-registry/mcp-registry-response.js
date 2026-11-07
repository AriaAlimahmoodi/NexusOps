"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMcpRegistryServerResponse = toMcpRegistryServerResponse;
const mcp_registry_connection_1 = require("./mcp-registry-connection");
const node_description_transform_1 = require("./node-description-transform");
function toMcpRegistryServerResponse(server) {
    const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
    if (!connection)
        return null;
    const credentials = (0, node_description_transform_1.getMcpRegistryCredentialOptions)(server).filter((option) => connection.credentialBindings.some((binding) => binding.credentialType === option.credentialType));
    if (credentials.length === 0)
        return null;
    return {
        slug: server.slug,
        nodeTypeName: connection.nodeTypeName,
        name: server.name,
        title: server.title,
        description: server.description,
        tagline: server.tagline,
        version: server.version,
        updatedAt: server.updatedAt,
        icons: server.icons,
        websiteUrl: server.websiteUrl,
        credentials,
        tools: server.tools.map((tool) => ({
            name: tool.name,
            ...(tool.title ? { title: tool.title } : {}),
        })),
        isTemplated: connection.isTemplated === true,
        isOfficial: server.isOfficial,
        status: server.status,
        tags: server.tags,
    };
}
//# sourceMappingURL=mcp-registry-response.js.map