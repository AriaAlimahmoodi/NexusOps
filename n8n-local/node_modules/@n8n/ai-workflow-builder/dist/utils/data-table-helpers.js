"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DATA_TABLE_ROW_COLUMN_MAPPING_OPERATIONS = exports.SET_NODE_TYPE = exports.DATA_TABLE_NODE_TYPE = void 0;
exports.isDataTableRowColumnOperation = isDataTableRowColumnOperation;
exports.extractSetNodeFields = extractSetNodeFields;
exports.extractDataTableInfo = extractDataTableInfo;
const n8n_workflow_1 = require("n8n-workflow");
exports.DATA_TABLE_NODE_TYPE = 'n8n-nodes-base.dataTable';
exports.SET_NODE_TYPE = 'n8n-nodes-base.set';
exports.DATA_TABLE_ROW_COLUMN_MAPPING_OPERATIONS = [
    'insert',
    'update',
    'upsert',
];
function isDataTableRowColumnOperation(operation) {
    return exports.DATA_TABLE_ROW_COLUMN_MAPPING_OPERATIONS.includes(operation);
}
function mapSetNodeTypeToDataTableType(setNodeType) {
    switch (setNodeType) {
        case 'number':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'string':
        default:
            return 'text';
    }
}
function isSetNodeAssignments(value) {
    if (typeof value !== 'object' || value === null)
        return false;
    const obj = value;
    if (!('assignments' in obj))
        return true;
    if (!Array.isArray(obj.assignments))
        return false;
    return obj.assignments.every((item) => typeof item === 'object' &&
        item !== null &&
        'name' in item &&
        'type' in item &&
        typeof item.name === 'string' &&
        typeof item.type === 'string');
}
function extractSetNodeFields(workflow, nodeName) {
    const node = workflow.nodes.find((n) => n.name === nodeName && n.type === exports.SET_NODE_TYPE);
    if (!node)
        return [];
    const params = node.parameters ?? {};
    const assignments = params.assignments;
    if (!isSetNodeAssignments(assignments) || !assignments.assignments)
        return [];
    return assignments.assignments
        .filter((a) => a.name && a.type)
        .map((a) => ({
        name: a.name,
        type: mapSetNodeTypeToDataTableType(a.type),
    }));
}
function extractDataTableInfo(workflow) {
    const dataTableNodes = workflow.nodes.filter((node) => node.type === exports.DATA_TABLE_NODE_TYPE);
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(workflow.connections);
    return dataTableNodes.map((node) => {
        const params = node.parameters ?? {};
        let tableName = undefined;
        const dataTableId = params.dataTableId;
        if (dataTableId?.value) {
            tableName = dataTableId.value;
        }
        const operation = params.operation ?? 'insert';
        let columns = [];
        let setNodeName = undefined;
        if (isDataTableRowColumnOperation(operation)) {
            const predecessors = (0, n8n_workflow_1.getParentNodes)(connectionsByDestination, node.name, 'main', 1);
            for (const predecessorName of predecessors) {
                const setFields = extractSetNodeFields(workflow, predecessorName);
                if (setFields.length > 0) {
                    columns = setFields;
                    setNodeName = predecessorName;
                    break;
                }
            }
        }
        return {
            nodeName: node.name,
            tableName,
            columns,
            setNodeName,
            operation,
        };
    });
}
//# sourceMappingURL=data-table-helpers.js.map