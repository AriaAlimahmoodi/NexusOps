"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findWorkflowToolWorkflows = findWorkflowToolWorkflows;
exports.findWorkflowToolWorkflow = findWorkflowToolWorkflow;
exports.normalizeWorkflowToolRefs = normalizeWorkflowToolRefs;
const extract_agent_workflow_refs_1 = require("../utils/extract-agent-workflow-refs");
async function findWorkflowToolWorkflows(workflowRepository, refs, projectId) {
    if (refs.length === 0)
        return new Map();
    const workflowIds = [
        ...new Set(refs.flatMap((ref) => (ref.workflowId === undefined ? [] : [ref.workflowId]))),
    ];
    const legacyWorkflowNames = [
        ...new Set(refs.flatMap((ref) => (ref.workflowId === undefined ? [ref.workflow] : []))),
    ];
    const workflows = await workflowRepository.findManyByAgentToolReferences(projectId, workflowIds, legacyWorkflowNames);
    const workflowsByReference = new Map();
    const requestedIds = new Set(workflowIds);
    const requestedNames = new Set(legacyWorkflowNames);
    for (const workflow of workflows) {
        if (requestedIds.has(workflow.id))
            workflowsByReference.set(workflow.id, workflow);
        if (requestedNames.has(workflow.name))
            workflowsByReference.set(workflow.name, workflow);
    }
    return workflowsByReference;
}
async function findWorkflowToolWorkflow(workflowRepository, ref, projectId) {
    return await workflowRepository.findOneByAgentToolReference(projectId, {
        workflowName: ref.workflow,
        ...(ref.workflowId !== undefined ? { workflowId: ref.workflowId } : {}),
    });
}
async function normalizeWorkflowToolRefs(workflowRepository, config, projectId) {
    const legacyRefs = (0, extract_agent_workflow_refs_1.extractAgentWorkflowRefs)(config).filter((ref) => ref.enabled !== false && ref.workflowId === undefined);
    if (legacyRefs.length === 0)
        return;
    const values = [...new Set(legacyRefs.map((ref) => ref.workflow))];
    const workflows = await workflowRepository.findManyByAgentToolReferences(projectId, values, values);
    const projectNames = new Set(workflows.map((workflow) => workflow.name));
    const idToName = new Map(workflows.map((workflow) => [workflow.id, workflow.name]));
    for (const ref of legacyRefs) {
        if (projectNames.has(ref.workflow))
            continue;
        const name = idToName.get(ref.workflow);
        if (name)
            ref.workflow = name;
    }
}
//# sourceMappingURL=workflow-tool-workflow-resolver.js.map