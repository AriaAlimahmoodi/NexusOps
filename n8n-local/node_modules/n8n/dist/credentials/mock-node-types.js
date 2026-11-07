"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMockNodeTypes = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const constants_1 = require("../constants");
const createMockNodeTypes = () => {
    const nodesData = {
        mock: {
            sourcePath: '',
            type: {
                description: { properties: [] },
            },
        },
    };
    const nodeTypes = {
        getKnownTypes() {
            return {};
        },
        getByName(nodeType) {
            return nodesData[nodeType]?.type;
        },
        getByNameAndVersion(nodeType, version) {
            if (!nodesData[nodeType]) {
                throw new n8n_workflow_1.UnexpectedError(constants_1.RESPONSE_ERROR_MESSAGES.NO_NODE, {
                    tags: { nodeType },
                });
            }
            return n8n_workflow_1.NodeHelpers.getVersionedNodeType(nodesData[nodeType].type, version);
        },
    };
    return { nodesData, nodeTypes };
};
exports.createMockNodeTypes = createMockNodeTypes;
//# sourceMappingURL=mock-node-types.js.map