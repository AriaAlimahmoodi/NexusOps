"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowState = void 0;
const langgraph_1 = require("@langchain/langgraph");
const state_reducers_1 = require("./utils/state-reducers");
function operationsReducer(current, update) {
    if (update === null) {
        return [];
    }
    if (!update || update.length === 0) {
        return current ?? [];
    }
    if (update.some((op) => op.type === 'clear')) {
        return update.filter((op) => op.type === 'clear').slice(-1);
    }
    if (!current && !update) {
        return [];
    }
    return [...(current ?? []), ...update];
}
exports.WorkflowState = langgraph_1.Annotation.Root({
    messages: (0, langgraph_1.Annotation)({
        reducer: langgraph_1.messagesStateReducer,
        default: () => [],
    }),
    workflowJSON: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => ({ nodes: [], connections: {}, name: '' }),
    }),
    workflowOperations: (0, langgraph_1.Annotation)({
        reducer: operationsReducer,
        default: () => [],
    }),
    workflowContext: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
    }),
    workflowValidation: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y === undefined ? x : y),
        default: () => null,
    }),
    validationHistory: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y && y.length > 0 ? [...x, ...y] : x),
        default: () => [],
    }),
    techniqueCategories: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y && y.length > 0 ? [...x, ...y] : x),
        default: () => [],
    }),
    previousSummary: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => 'EMPTY',
    }),
    templateIds: (0, langgraph_1.Annotation)({
        reducer: state_reducers_1.appendArrayReducer,
        default: () => [],
    }),
    cachedTemplates: (0, langgraph_1.Annotation)({
        reducer: state_reducers_1.cachedTemplatesReducer,
        default: () => [],
    }),
});
//# sourceMappingURL=workflow-state.js.map