"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFavoriteResolver = registerFavoriteResolver;
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const agent_repository_1 = require("./repositories/agent.repository");
function registerFavoriteResolver() {
    const agentRepository = di_1.Container.get(agent_repository_1.AgentRepository);
    di_1.Container.get(backend_services_1.FavoriteResourceResolverRegistry).register('agent', {
        globalReadScope: 'agent:read',
        findMeta: async (ids) => new Map((await agentRepository.findSummariesByIds(ids)).map(({ id, name, projectId }) => [
            id,
            { name, projectId },
        ])),
        exists: async (id) => (await agentRepository.getProjectIdById(id)) !== null,
    });
}
//# sourceMappingURL=register-favorite-resolver.js.map