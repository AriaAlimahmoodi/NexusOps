"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleGemini = void 0;
const router_1 = require("./actions/router");
const versionDescription_1 = require("./actions/versionDescription");
const methods_1 = require("./methods");
class GoogleGemini {
    constructor() {
        this.description = versionDescription_1.versionDescription;
        this.methods = {
            listSearch: methods_1.listSearch,
        };
    }
    async execute() {
        return await router_1.router.call(this);
    }
}
exports.GoogleGemini = GoogleGemini;
//# sourceMappingURL=GoogleGemini.node.js.map