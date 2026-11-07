"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PipedriveV2 = void 0;
const router_1 = require("./actions/router");
const versionDescription_1 = require("./actions/versionDescription");
const methods_1 = require("./methods");
class PipedriveV2 {
    description;
    constructor(baseDescription) {
        this.description = {
            ...baseDescription,
            ...versionDescription_1.versionDescription,
            usableAsTool: true,
        };
    }
    methods = {
        loadOptions: methods_1.loadOptions,
    };
    async execute() {
        return await router_1.router.call(this);
    }
}
exports.PipedriveV2 = PipedriveV2;
//# sourceMappingURL=PipedriveV2.node.js.map