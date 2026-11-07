"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertRequiredModulesActive = assertRequiredModulesActive;
const errors_1 = require("@n8n/errors");
const REQUIRED_MODULES = ['agents', 'data-table'];
function assertRequiredModulesActive(moduleRegistry) {
    const inactive = REQUIRED_MODULES.filter((name) => !moduleRegistry.isActive(name));
    if (inactive.length > 0) {
        throw new errors_1.NotFoundError(`Agent evals require these modules to be active: ${inactive.join(', ')}.`);
    }
}
//# sourceMappingURL=agent-evals-required-modules.js.map