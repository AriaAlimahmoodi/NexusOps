"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packagedModules = void 0;
exports.packagedModules = {
    insights: async () => await import('@n8n/backend-module-insights/module'),
    'quick-connect': async () => await import('@n8n/backend-module-quick-connect/module'),
    'workflow-builder': async () => await import('@n8n/backend-module-workflow-builder/module'),
};
//# sourceMappingURL=modules.manifest.js.map