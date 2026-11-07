"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMcpRegistryServers = listMcpRegistryServers;
exports.searchMcpRegistryServers = searchMcpRegistryServers;
const change_case_1 = require("change-case");
const mcp_registry_connection_1 = require("../mcp-registry-connection");
function toSearchResult(server) {
    const connection = (0, mcp_registry_connection_1.resolveMcpRegistryConnection)(server);
    if (!connection)
        return null;
    const defaultCredential = connection.credentialBindings[0];
    if (!defaultCredential)
        return null;
    return {
        slug: server.slug,
        name: (0, change_case_1.camelCase)(server.slug),
        title: server.title,
        description: server.tagline,
        url: (0, mcp_registry_connection_1.getConfiguredEndpointUrl)(connection),
        transport: (0, mcp_registry_connection_1.toAgentMcpTransport)(connection.transport),
        authentication: defaultCredential.credentialType,
        credentialType: defaultCredential.credentialType,
        tools: server.tools.map((tool) => ({
            name: tool.name,
            ...(tool.title ? { title: tool.title } : {}),
        })),
        metadata: { nodeTypeName: connection.nodeTypeName },
        isTemplated: connection.isTemplated === true,
    };
}
function listMcpRegistryServers(servers) {
    return servers.flatMap((server) => {
        const result = toSearchResult(server);
        return result ? [result] : [];
    });
}
function normalizeQueries(queries) {
    return queries.map((query) => query.trim().toLowerCase()).filter((query) => query.length > 0);
}
function matchesQuery(server, normalizedQueries) {
    const fields = [
        server.slug,
        (0, change_case_1.camelCase)(server.slug),
        server.title,
        server.description,
        server.tagline,
    ]
        .filter((field) => typeof field === 'string')
        .map((field) => field.toLowerCase());
    return normalizedQueries.some((query) => fields.some((field) => field.includes(query)));
}
function relevance(server, normalizedQueries) {
    const names = [server.slug, (0, change_case_1.camelCase)(server.slug), server.title]
        .filter((name) => typeof name === 'string')
        .map((name) => name.toLowerCase());
    if (normalizedQueries.some((query) => names.includes(query)))
        return 2;
    if (normalizedQueries.some((query) => names.some((name) => name.includes(query))))
        return 1;
    return 0;
}
function searchMcpRegistryServers(servers, queries) {
    const normalized = normalizeQueries(queries);
    if (normalized.length === 0)
        return [];
    return listMcpRegistryServers(servers
        .filter((server) => matchesQuery(server, normalized))
        .map((server) => ({ server, score: relevance(server, normalized) }))
        .sort((left, right) => right.score - left.score)
        .map(({ server }) => server));
}
//# sourceMappingURL=mcp-registry-search.js.map