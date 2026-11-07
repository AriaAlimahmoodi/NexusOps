"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.modelSearch = modelSearch;
const transport_1 = require("../transport");
async function modelSearch(filter) {
    const response = await transport_1.apiRequest.call(this, 'GET', '/api/tags');
    let models = response.models;
    if (filter) {
        models = models.filter((model) => model.name.toLowerCase().includes(filter.toLowerCase()));
    }
    return {
        results: models.map((model) => ({ name: model.name, value: model.name })),
    };
}
//# sourceMappingURL=listSearch.js.map