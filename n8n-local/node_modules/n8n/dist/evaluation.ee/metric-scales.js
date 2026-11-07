"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfigMetricScales = resolveConfigMetricScales;
exports.runMetricScales = runMetricScales;
const api_types_1 = require("@n8n/api-types");
async function resolveConfigMetricScales(evalConfigRepo, evaluationConfigId, workflowId) {
    const config = await evalConfigRepo.findByIdAndWorkflowId(evaluationConfigId, workflowId);
    return config ? (0, api_types_1.metricScalesFromConfig)(config.metrics) : {};
}
function runMetricScales(run, defaultScales) {
    return (0, api_types_1.metricScalesFromSnapshot)(run.evaluationConfigSnapshot) ?? defaultScales;
}
//# sourceMappingURL=metric-scales.js.map