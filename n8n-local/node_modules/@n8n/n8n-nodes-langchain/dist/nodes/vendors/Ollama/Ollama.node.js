"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ollama = void 0;
const router_1 = require("./actions/router");
const versionDescription_1 = require("./actions/versionDescription");
const methods_1 = require("./methods");
class Ollama {
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
exports.Ollama = Ollama;
//# sourceMappingURL=Ollama.node.js.map