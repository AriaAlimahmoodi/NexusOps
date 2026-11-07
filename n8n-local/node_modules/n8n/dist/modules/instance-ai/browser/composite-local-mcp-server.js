"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeLocalMcpServer = void 0;
exports.composeLocalMcpServers = composeLocalMcpServers;
function composeLocalMcpServers(...servers) {
    const present = servers.filter((server) => server !== undefined);
    if (present.length === 0) {
        return undefined;
    }
    if (present.length === 1) {
        return present[0];
    }
    return new CompositeLocalMcpServer(present);
}
class CompositeLocalMcpServer {
    constructor(servers) {
        this.servers = servers;
        this.availableToolsByCategory = new Map();
        this.availableTools = this.dedupe((server) => server.getAvailableTools());
    }
    getAvailableTools() {
        return this.unwrapTools(this.availableTools);
    }
    getToolsByCategory(category) {
        if (!this.availableToolsByCategory.has(category)) {
            this.availableToolsByCategory.set(category, this.dedupe((server) => server.getToolsByCategory(category)));
        }
        return this.unwrapTools(this.availableToolsByCategory.get(category));
    }
    async callTool(req, options) {
        const serverTool = this.availableTools.get(req.name);
        if (!serverTool) {
            return {
                content: [{ type: 'text', text: `Unknown tool: ${req.name}` }],
                isError: true,
            };
        }
        return await serverTool.server.callTool(req, options);
    }
    unwrapTools(tools) {
        return Array.from(tools.values()).map(({ tool }) => tool);
    }
    dedupe(getter) {
        const toolsMap = new Map();
        for (const server of this.servers) {
            for (const tool of getter(server)) {
                toolsMap.set(tool.name, {
                    server,
                    tool,
                });
            }
        }
        return toolsMap;
    }
}
exports.CompositeLocalMcpServer = CompositeLocalMcpServer;
//# sourceMappingURL=composite-local-mcp-server.js.map