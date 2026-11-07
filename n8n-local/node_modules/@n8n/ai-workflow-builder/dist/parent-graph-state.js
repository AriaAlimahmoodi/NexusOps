"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParentGraphState = void 0;
const langgraph_1 = require("@langchain/langgraph");
const state_reducers_1 = require("./utils/state-reducers");
exports.ParentGraphState = langgraph_1.Annotation.Root({
    messages: (0, langgraph_1.Annotation)({
        reducer: langgraph_1.messagesStateReducer,
        default: () => [],
    }),
    workflowJSON: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => ({ nodes: [], connections: {}, name: '' }),
    }),
    workflowContext: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
    }),
    nextPhase: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => '',
    }),
    discoveryContext: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => null,
    }),
    workflowOperations: (0, langgraph_1.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    coordinationLog: (0, langgraph_1.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    previousSummary: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => '',
    }),
    templateIds: (0, langgraph_1.Annotation)({
        reducer: state_reducers_1.appendArrayReducer,
        default: () => [],
    }),
    cachedTemplates: (0, langgraph_1.Annotation)({
        reducer: state_reducers_1.cachedTemplatesReducer,
        default: () => [],
    }),
    planOutput: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y === undefined ? x : y),
        default: () => null,
    }),
    mode: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => 'build',
    }),
    planDecision: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y === undefined ? x : y),
        default: () => null,
    }),
    planFeedback: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y === undefined ? x : y),
        default: () => null,
    }),
    planPrevious: (0, langgraph_1.Annotation)({
        reducer: (x, y) => (y === undefined ? x : y),
        default: () => null,
    }),
    introspectionEvents: (0, langgraph_1.Annotation)({
        reducer: (x, y) => x.concat(y),
        default: () => [],
    }),
    sdkSessionId: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => undefined,
    }),
    approvedDomains: (0, langgraph_1.Annotation)({
        reducer: (x, y) => [...new Set([...x, ...y])],
        default: () => [],
    }),
    webFetchCount: (0, langgraph_1.Annotation)({
        reducer: (_x, y) => y,
        default: () => 0,
    }),
    allDomainsApproved: (0, langgraph_1.Annotation)({
        reducer: (x, y) => y ?? x,
        default: () => false,
    }),
});
//# sourceMappingURL=parent-graph-state.js.map