"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOfferedAgentModelProviders = filterOfferedAgentModelProviders;
const api_types_1 = require("@n8n/api-types");
function filterOfferedAgentModelProviders(catalog) {
    const filteredCatalog = {};
    for (const provider of api_types_1.AGENT_MODEL_PROVIDERS) {
        const providerInfo = catalog[provider];
        if (providerInfo) {
            filteredCatalog[provider] = providerInfo;
        }
    }
    return filteredCatalog;
}
//# sourceMappingURL=model-catalog.js.map