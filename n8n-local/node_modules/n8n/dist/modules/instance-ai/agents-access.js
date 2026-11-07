"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAgentsAccessEnabled = isAgentsAccessEnabled;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
function isAgentsAccessEnabled(moduleRegistry = di_1.Container.get(backend_common_1.ModuleRegistry)) {
    return (moduleRegistry.isActive('agents') && moduleRegistry.settings.get('agents')?.enabled !== false);
}
//# sourceMappingURL=agents-access.js.map