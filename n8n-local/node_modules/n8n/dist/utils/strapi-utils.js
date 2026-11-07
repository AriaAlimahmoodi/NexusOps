"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginatedRequest = paginatedRequest;
exports.buildStrapiUpdateQuery = buildStrapiUpdateQuery;
const backend_common_1 = require("@n8n/backend-common");
const backend_network_1 = require("@n8n/backend-network");
const di_1 = require("@n8n/di");
const n8n_core_1 = require("n8n-core");
const REQUEST_TIMEOUT_MS = 6000;
function isV4WrappedEntity(item) {
    return 'attributes' in item && item.attributes !== null && typeof item.attributes === 'object';
}
function flattenStrapiEntity(item) {
    if (isV4WrappedEntity(item)) {
        return { id: item.id, ...item.attributes };
    }
    const flattened = { ...item };
    delete flattened.documentId;
    return flattened;
}
async function paginatedRequest(url, params, options) {
    let returnData = [];
    let responseData = [];
    do {
        let response;
        try {
            response = await di_1.Container.get(backend_network_1.OutboundHttp)
                .requests({
                useDefaultSsrfPolicy: 'unsafe',
                timeout: REQUEST_TIMEOUT_MS,
            })
                .request({
                url,
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
                qs: params,
                json: true,
                abortSignal: options?.abortSignal,
            });
        }
        catch (error) {
            if (!options?.abortSignal?.aborted) {
                di_1.Container.get(n8n_core_1.ErrorReporter).error(error, {
                    tags: { source: 'strapiPaginatedRequest' },
                });
                di_1.Container.get(backend_common_1.Logger).error(`Error fetching from Strapi API (${url}): ${error.message}`);
            }
            if (options?.throwOnError)
                throw error;
            break;
        }
        responseData = response?.data?.map(flattenStrapiEntity);
        if (!responseData?.length)
            break;
        returnData = returnData.concat(responseData);
        if (response?.meta?.pagination) {
            const { page, pageCount } = response.meta.pagination;
            if (page === pageCount)
                break;
        }
        params.pagination.page++;
    } while (responseData?.length);
    return returnData;
}
function buildStrapiUpdateQuery(ids) {
    return {
        filters: {
            id: {
                $in: ids,
            },
        },
    };
}
//# sourceMappingURL=strapi-utils.js.map