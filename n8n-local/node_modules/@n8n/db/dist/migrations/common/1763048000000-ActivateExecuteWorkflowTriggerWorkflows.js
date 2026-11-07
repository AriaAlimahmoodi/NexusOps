"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateExecuteWorkflowTriggerWorkflows1763048000000 = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_crypto_1 = require("node:crypto");
class ActivateExecuteWorkflowTriggerWorkflows1763048000000 {
    findExecuteWfAndErrorTriggers(nodes) {
        let executeWorkflowTriggerNode;
        let errorTriggerNode;
        for (const node of nodes) {
            if (node.type === n8n_workflow_1.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE) {
                executeWorkflowTriggerNode = node;
            }
            else if (node.type === n8n_workflow_1.ERROR_TRIGGER_NODE_TYPE) {
                errorTriggerNode = node;
            }
            if (executeWorkflowTriggerNode && errorTriggerNode) {
                break;
            }
        }
        return { executeWorkflowTriggerNode, errorTriggerNode };
    }
    async up({ escape, runQuery, runInBatches, parseJson, isPostgres, logger, migrationName, }) {
        const tableName = escape.tableName('workflow_entity');
        const historyTableName = escape.tableName('workflow_history');
        const idColumn = escape.columnName('id');
        const versionIdColumn = escape.columnName('versionId');
        const nodesColumn = escape.columnName('nodes');
        const connectionsColumn = escape.columnName('connections');
        const activeColumn = escape.columnName('active');
        const activeVersionIdColumn = escape.columnName('activeVersionId');
        const workflowIdColumn = escape.columnName('workflowId');
        const authorsColumn = escape.columnName('authors');
        const createdAtColumn = escape.columnName('createdAt');
        const updatedAtColumn = escape.columnName('updatedAt');
        const nodesColumnForLike = isPostgres ? `${nodesColumn}::text` : nodesColumn;
        const inactiveWorkflows = `SELECT ${idColumn}, ${nodesColumn}, ${connectionsColumn}, ${versionIdColumn}, ${activeVersionIdColumn} FROM ${tableName} WHERE ${activeColumn} = false AND (${nodesColumnForLike} LIKE '%n8n-nodes-base.executeWorkflowTrigger%' OR ${nodesColumnForLike} LIKE '%n8n-nodes-base.errorTrigger%')`;
        await runInBatches(inactiveWorkflows, async (workflows) => {
            for (const workflow of workflows) {
                let nodes;
                try {
                    nodes = parseJson(workflow.nodes);
                }
                catch (error) {
                    logger.warn(`[${migrationName}] Failed to parse nodes for workflow ${workflow.id}: ${error instanceof Error ? error.message : 'Unknown error'}. Skipping this workflow.`);
                    continue;
                }
                const { executeWorkflowTriggerNode, errorTriggerNode } = this.findExecuteWfAndErrorTriggers(nodes);
                if (!executeWorkflowTriggerNode && !errorTriggerNode) {
                    continue;
                }
                const executeWorkflowTriggerDisabled = executeWorkflowTriggerNode?.disabled === true;
                const errorTriggerDisabled = errorTriggerNode?.disabled === true;
                if ((!executeWorkflowTriggerNode || executeWorkflowTriggerDisabled) &&
                    (!errorTriggerNode || errorTriggerDisabled)) {
                    continue;
                }
                let hasValidExecuteWorkflowTrigger = false;
                if (executeWorkflowTriggerNode && !executeWorkflowTriggerDisabled) {
                    const inputSource = executeWorkflowTriggerNode.parameters?.inputSource;
                    const shouldActivateByInputSource = inputSource === 'passthrough' || inputSource === 'jsonExample';
                    let hasLegacyParametersOrIsVersion1 = false;
                    if (!inputSource) {
                        const params = executeWorkflowTriggerNode.parameters;
                        if (!params || Object.keys(params).length === 0) {
                            hasLegacyParametersOrIsVersion1 = true;
                        }
                        else {
                            const workflowInputs = params.workflowInputs;
                            hasLegacyParametersOrIsVersion1 = Boolean(workflowInputs &&
                                typeof workflowInputs === 'object' &&
                                'values' in workflowInputs &&
                                Array.isArray(workflowInputs.values) &&
                                workflowInputs.values.length > 0 &&
                                this.hasValidWorkflowInputs(workflowInputs.values));
                        }
                    }
                    hasValidExecuteWorkflowTrigger =
                        shouldActivateByInputSource || hasLegacyParametersOrIsVersion1;
                    if (!hasValidExecuteWorkflowTrigger && !errorTriggerNode) {
                        continue;
                    }
                }
                let nodesModified = false;
                nodes.forEach((node) => {
                    if (node.type && this.isTriggerNode(node.type)) {
                        if (node.type === n8n_workflow_1.EXECUTE_WORKFLOW_TRIGGER_NODE_TYPE &&
                            hasValidExecuteWorkflowTrigger) {
                            return;
                        }
                        if (node.type === n8n_workflow_1.ERROR_TRIGGER_NODE_TYPE) {
                            return;
                        }
                        if (!node.disabled) {
                            node.disabled = true;
                            nodesModified = true;
                        }
                    }
                });
                if (nodesModified) {
                    const newVersionId = (0, node_crypto_1.randomUUID)();
                    await runQuery(`INSERT INTO ${historyTableName} (${versionIdColumn}, ${workflowIdColumn}, ${authorsColumn}, ${nodesColumn}, ${connectionsColumn}, ${createdAtColumn}, ${updatedAtColumn}) VALUES (:versionId, :workflowId, :authors, :nodes, :connections, :createdAt, :updatedAt)`, {
                        versionId: newVersionId,
                        workflowId: workflow.id,
                        authors: 'system migration',
                        nodes: JSON.stringify(nodes),
                        connections: workflow.connections,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                    await runQuery(`UPDATE ${tableName} SET ${activeColumn} = :active, ${nodesColumn} = :nodes, ${versionIdColumn} = :versionId, ${activeVersionIdColumn} = :activeVersionId WHERE ${idColumn} = :id`, {
                        active: true,
                        nodes: JSON.stringify(nodes),
                        versionId: newVersionId,
                        activeVersionId: newVersionId,
                        id: workflow.id,
                    });
                }
                else {
                    await runQuery(`UPDATE ${tableName} SET ${activeColumn} = :active, ${activeVersionIdColumn} = :versionId WHERE ${idColumn} = :id`, {
                        active: true,
                        versionId: workflow.versionId,
                        id: workflow.id,
                    });
                }
            }
        });
    }
    isTriggerNode(nodeType) {
        return nodeType.includes('Trigger');
    }
    hasValidWorkflowInputs(values) {
        return values.every((value) => value &&
            typeof value === 'object' &&
            'name' in value &&
            typeof value.name === 'string' &&
            value.name.length > 0 &&
            (!('type' in value) || (typeof value.type === 'string' && value.type.length > 0)));
    }
}
exports.ActivateExecuteWorkflowTriggerWorkflows1763048000000 = ActivateExecuteWorkflowTriggerWorkflows1763048000000;
//# sourceMappingURL=1763048000000-ActivateExecuteWorkflowTriggerWorkflows.js.map