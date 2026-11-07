"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toV1Status = toV1Status;
exports.toV1Mode = toV1Mode;
exports.resolveV2Statuses = resolveV2Statuses;
const node_assert_1 = __importDefault(require("node:assert"));
const n8n_workflow_1 = require("n8n-workflow");
const V1_STATUS_BY_V2_STATUS = new Map([
    ['queued', 'new'],
    ['running', 'running'],
    ['waiting', 'waiting'],
    ['completed', 'success'],
    ['failed', 'error'],
    ['cancelled', 'canceled'],
]);
const V1_MODE_BY_REPORTED_MODE = new Map(n8n_workflow_1.WorkflowExecuteModeList.map((mode) => [mode, mode]));
function toV1Status(status) {
    return V1_STATUS_BY_V2_STATUS.get(status) ?? 'unknown';
}
function toV1Mode(hostMode) {
    const v1Mode = V1_MODE_BY_REPORTED_MODE.get(hostMode);
    (0, node_assert_1.default)(v1Mode, `Unknown v1 mode ${hostMode}`);
    return v1Mode;
}
function resolveV2Statuses(v1Statuses) {
    if (!v1Statuses?.length)
        return undefined;
    return [...V1_STATUS_BY_V2_STATUS.entries()]
        .filter(([, v1]) => v1Statuses.includes(v1))
        .map(([v2]) => v2);
}
//# sourceMappingURL=engine-v2-mapping.js.map