"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelSearch = modelSearch;
const transport_1 = require("../transport");
async function modelSearch(filter) {
    const response = (await transport_1.apiRequest.call(this, 'GET', '/v1/models'));
    let models = response.data;
    if (filter) {
        models = models.filter((model) => model.id.toLowerCase().includes(filter.toLowerCase()));
    }
    return {
        results: models.map((model) => ({
            name: model.id,
            value: model.id,
        })),
    };
}
//# sourceMappingURL=listSearch.js.map