"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerResourceGate = triggerResourceGate;
const grant_authorization_1 = require("../../modules/inbound-auth-core/grant-authorization");
function triggerResourceGate(workflowFinderService, grant) {
    return {
        getGrant: () => grant,
        authorize: async (user) => await (0, grant_authorization_1.authorizeAgainstGrant)(workflowFinderService, grant, user),
    };
}
//# sourceMappingURL=resource-gate.js.map