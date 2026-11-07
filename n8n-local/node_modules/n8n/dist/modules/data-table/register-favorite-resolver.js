"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFavoriteResolver = registerFavoriteResolver;
const di_1 = require("@n8n/di");
const backend_services_1 = require("@n8n/backend-services");
const data_table_repository_1 = require("./data-table.repository");
function registerFavoriteResolver() {
    const dataTableRepository = di_1.Container.get(data_table_repository_1.DataTableRepository);
    di_1.Container.get(backend_services_1.FavoriteResourceResolverRegistry).register('dataTable', {
        globalReadScope: 'dataTable:read',
        findMeta: async (ids) => new Map((await dataTableRepository.findSummariesByIds(ids)).map(({ id, name, projectId }) => [
            id,
            { name, projectId },
        ])),
        exists: async (id) => await dataTableRepository.existsBy({ id }),
    });
}
//# sourceMappingURL=register-favorite-resolver.js.map