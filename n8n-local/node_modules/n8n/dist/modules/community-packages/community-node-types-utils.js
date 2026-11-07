"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectVettedVersion = selectVettedVersion;
exports.getCommunityNodeTypes = getCommunityNodeTypes;
exports.getCommunityNodesMetadata = getCommunityNodesMetadata;
const strapi_utils_1 = require("../../utils/strapi-utils");
function selectVettedVersion(vetted, requestedVersion) {
    const version = requestedVersion ?? vetted.npmVersion;
    const checksum = version === vetted.npmVersion
        ? vetted.checksum
        : vetted.nodeVersions?.find((v) => v.npmVersion === version)?.checksum;
    return { version, checksum };
}
const N8N_VETTED_NODE_TYPES_STAGING_URL = 'https://api-staging.n8n.io/api/community-nodes';
const N8N_VETTED_NODE_TYPES_PRODUCTION_URL = 'https://api.n8n.io/api/community-nodes';
function getUrl(environment) {
    return environment === 'production'
        ? N8N_VETTED_NODE_TYPES_PRODUCTION_URL
        : N8N_VETTED_NODE_TYPES_STAGING_URL;
}
async function getCommunityNodeTypes(environment, qs = {}, maxAiNodeSdk, maxN8nNodesApiVersion) {
    const url = getUrl(environment);
    const params = {
        ...qs,
        maxAiNodeSdk,
        maxN8nNodesApiVersion,
        pagination: {
            page: 1,
            pageSize: 25,
        },
    };
    return await (0, strapi_utils_1.paginatedRequest)(url, params);
}
async function getCommunityNodesMetadata(environment, maxAiNodeSdk, maxN8nNodesApiVersion) {
    const url = getUrl(environment);
    const params = {
        fields: ['npmVersion', 'name', 'updatedAt'],
        maxAiNodeSdk,
        maxN8nNodesApiVersion,
        pagination: {
            page: 1,
            pageSize: 500,
        },
    };
    return await (0, strapi_utils_1.paginatedRequest)(url, params, {
        throwOnError: true,
    });
}
//# sourceMappingURL=community-node-types-utils.js.map