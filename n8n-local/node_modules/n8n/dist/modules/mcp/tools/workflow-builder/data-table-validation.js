"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDataTableReferencesForWorkflow = validateDataTableReferencesForWorkflow;
exports.validateDataTableReferencesForUpdate = validateDataTableReferencesForUpdate;
const n8n_workflow_1 = require("n8n-workflow");
const data_table_proxy_service_1 = require("../../../../modules/data-table/data-table-proxy.service");
const isResourceLocatorMode = (v) => v === 'list' || v === 'id' || v === 'name';
function extractDataTableReference(node) {
    if (!(0, data_table_proxy_service_1.isAllowedNode)(node.type))
        return null;
    const rl = node.parameters?.dataTableId;
    if (!(0, n8n_workflow_1.isResourceLocatorValue)(rl))
        return null;
    if (typeof rl.value !== 'string' || rl.value === '')
        return null;
    if ((0, n8n_workflow_1.isExpression)(rl.value))
        return null;
    const mode = isResourceLocatorMode(rl.mode) ? rl.mode : 'id';
    return { mode, value: rl.value };
}
async function checkDataTableReference(ref, projectId, dataTableOps, cache) {
    const cacheKey = `${ref.mode}:${ref.value}:${projectId}`;
    const cached = cache.get(cacheKey);
    if (cached === true)
        return null;
    if (cached === false)
        return buildNotFoundError(ref);
    const filter = ref.mode === 'name' ? { name: ref.value, projectId } : { id: ref.value, projectId };
    try {
        const result = await dataTableOps.getManyAndCount({
            filter,
            take: 1,
        });
        if (result.data.length === 0) {
            cache.set(cacheKey, false);
            return buildNotFoundError(ref);
        }
        cache.set(cacheKey, true);
        return null;
    }
    catch (error) {
        cache.set(cacheKey, false);
        const message = error instanceof Error ? error.message : String(error);
        return `${buildNotFoundError(ref)} (lookup failed: ${message})`;
    }
}
function buildNotFoundError(ref) {
    const lookupBy = ref.mode === 'name' ? 'name' : 'id';
    return (`data table with ${lookupBy} '${ref.value}' not found or not accessible in this project. ` +
        'Use `create_data_table` to create it first, or `search_data_tables` to find an existing one.');
}
async function validateDataTableReferencesForWorkflow(nodes, projectId, dataTableOps) {
    const cache = new Map();
    for (const node of nodes) {
        const ref = extractDataTableReference(node);
        if (!ref)
            continue;
        const error = await checkDataTableReference(ref, projectId, dataTableOps, cache);
        if (error) {
            return { ok: false, error: `node '${node.name}': ${error}` };
        }
    }
    return { ok: true };
}
async function validateDataTableReferencesForUpdate(nodesAfterApply, touchedNodes, projectId, dataTableOps) {
    if (touchedNodes.size === 0)
        return { ok: true };
    const cache = new Map();
    for (const node of nodesAfterApply) {
        const opIndex = touchedNodes.get(node.name);
        if (opIndex === undefined)
            continue;
        const ref = extractDataTableReference(node);
        if (!ref)
            continue;
        const error = await checkDataTableReference(ref, projectId, dataTableOps, cache);
        if (error) {
            return {
                ok: false,
                opIndex,
                error: `Operation ${opIndex} failed: node '${node.name}': ${error}`,
            };
        }
    }
    return { ok: true };
}
//# sourceMappingURL=data-table-validation.js.map