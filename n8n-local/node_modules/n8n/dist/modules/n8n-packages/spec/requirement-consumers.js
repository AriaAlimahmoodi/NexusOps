"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkflowConsumerIds = getWorkflowConsumerIds;
exports.mergeRequirementConsumers = mergeRequirementConsumers;
const sortBy_1 = __importDefault(require("lodash/sortBy"));
const uniqBy_1 = __importDefault(require("lodash/uniqBy"));
function getWorkflowConsumerIds(requirement) {
    return requirement.usedBy.filter(({ kind }) => kind === 'workflow').map(({ id }) => id);
}
function mergeRequirementConsumers(consumers) {
    return (0, sortBy_1.default)((0, uniqBy_1.default)(consumers, ({ kind, id }) => `${kind}:${id}`), ['kind', 'id']);
}
//# sourceMappingURL=requirement-consumers.js.map