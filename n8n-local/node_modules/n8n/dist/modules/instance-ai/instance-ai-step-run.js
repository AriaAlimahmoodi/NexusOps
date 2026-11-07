"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveStepRunRoots = resolveStepRunRoots;
exports.buildMockedStepRunData = buildMockedStepRunData;
exports.collectAncestorNames = collectAncestorNames;
exports.findRootsAboveOtherRoots = findRootsAboveOtherRoots;
exports.findUncoveredAncestors = findUncoveredAncestors;
exports.planStepRun = planStepRun;
exports.pinDataForStepRun = pinDataForStepRun;
exports.isToolkitNode = isToolkitNode;
exports.declaredToolArguments = declaredToolArguments;
exports.buildToolAgentRequest = buildToolAgentRequest;
exports.toExecutionItems = toExecutionItems;
const n8n_workflow_1 = require("n8n-workflow");
const mcp_registry_connection_1 = require("../../modules/mcp-registry/mcp-registry-connection");
function taskDataOnOutput(items, outputIndex, executionIndex) {
    const outputs = [];
    for (let i = 0; i < outputIndex; i++)
        outputs.push([]);
    outputs.push(items);
    return {
        startTime: 0,
        executionTime: 0,
        executionIndex,
        executionStatus: 'success',
        source: [],
        data: { [n8n_workflow_1.NodeConnectionTypes.Main]: outputs },
    };
}
function directParents(connectionsByDestination, nodesByName, nodeName, seen = new Set()) {
    if (seen.has(nodeName))
        return [];
    seen.add(nodeName);
    const inputs = connectionsByDestination[nodeName]?.[n8n_workflow_1.NodeConnectionTypes.Main] ?? [];
    const edges = [];
    for (const input of inputs) {
        for (const connection of input ?? []) {
            const parent = nodesByName.get(connection.node);
            if (!parent)
                continue;
            if (parent.disabled) {
                edges.push(...directParents(connectionsByDestination, nodesByName, parent.name, seen));
                continue;
            }
            edges.push({ node: parent, outputIndex: connection.index });
        }
    }
    return edges;
}
function directChildren(connections, nodesByName, nodeName, outputIndex, seen = new Set()) {
    if (seen.has(nodeName))
        return [];
    seen.add(nodeName);
    const outputs = connections[nodeName]?.[n8n_workflow_1.NodeConnectionTypes.Main] ?? [];
    const edges = [];
    for (const [index, output] of outputs.entries()) {
        for (const connection of output ?? []) {
            const child = nodesByName.get(connection.node);
            if (!child)
                continue;
            const carriedBy = outputIndex ?? index;
            if (child.disabled) {
                edges.push(...directChildren(connections, nodesByName, child.name, carriedBy, seen));
                continue;
            }
            edges.push({ node: child, outputIndex: carriedBy });
        }
    }
    return edges;
}
function nonMainChildren(connections, nodesByName, nodeName) {
    const children = new Set();
    for (const [type, outputs] of Object.entries(connections[nodeName] ?? {})) {
        if (type === n8n_workflow_1.NodeConnectionTypes.Main)
            continue;
        for (const output of outputs ?? []) {
            for (const connection of output ?? []) {
                if (nodesByName.has(connection.node))
                    children.add(connection.node);
            }
        }
    }
    return [...children].sort();
}
function resolveStepRunRoots(nodes, connections, targetName) {
    const nodesByName = new Map(nodes.map((node) => [node.name, node]));
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(connections);
    const roots = new Set();
    const seen = new Set([targetName]);
    const queue = [targetName];
    while (queue.length > 0) {
        const current = queue.shift();
        if (directParents(connectionsByDestination, nodesByName, current).length > 0) {
            roots.add(current);
            continue;
        }
        const parents = nonMainChildren(connections, nodesByName, current);
        if (parents.length === 0) {
            roots.add(current);
            continue;
        }
        for (const parent of parents) {
            if (seen.has(parent))
                continue;
            seen.add(parent);
            queue.push(parent);
        }
    }
    return [...roots];
}
function buildMockedStepRunData(args) {
    const { nodes, connections, targetName, mockItems } = args;
    const rootNames = args.rootNames ?? [targetName];
    const nodesByName = new Map(nodes.map((node) => [node.name, node]));
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(connections);
    const runData = {};
    const mockedNodeNames = [];
    let executionIndex = 0;
    const visited = new Set([targetName]);
    let frontier = rootNames.flatMap((rootName) => directParents(connectionsByDestination, nodesByName, rootName));
    let depth = 0;
    while (frontier.length > 0) {
        const next = [];
        for (const edge of frontier) {
            if (visited.has(edge.node.name))
                continue;
            visited.add(edge.node.name);
            const items = depth === 0 ? mockItems : [{ json: {} }];
            runData[edge.node.name] = [taskDataOnOutput(items, edge.outputIndex, executionIndex++)];
            mockedNodeNames.push(edge.node.name);
            next.push(...directParents(connectionsByDestination, nodesByName, edge.node.name));
        }
        frontier = next;
        depth++;
    }
    return { runData, mockedNodeNames };
}
function collectAncestorNames(nodes, connections, targetName, rootNames = [targetName]) {
    const nodesByName = new Map(nodes.map((node) => [node.name, node]));
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(connections);
    const ancestors = new Set();
    const visited = new Set([targetName]);
    const queue = [...rootNames];
    while (queue.length > 0) {
        const current = queue.shift();
        for (const edge of directParents(connectionsByDestination, nodesByName, current)) {
            if (visited.has(edge.node.name))
                continue;
            visited.add(edge.node.name);
            ancestors.add(edge.node.name);
            queue.push(edge.node.name);
        }
    }
    return [...ancestors];
}
function findRootsAboveOtherRoots(nodes, connections, rootNames) {
    if (rootNames.length < 2)
        return [];
    const above = new Set();
    for (const rootName of rootNames) {
        const ancestors = new Set(collectAncestorNames(nodes, connections, rootName));
        for (const other of rootNames) {
            if (other !== rootName && ancestors.has(other))
                above.add(other);
        }
    }
    return rootNames.filter((name) => above.has(name));
}
function outputCarriedItems(runData, nodeName, outputIndex) {
    return (runData[nodeName] ?? []).some((task) => (task.data?.[n8n_workflow_1.NodeConnectionTypes.Main]?.[outputIndex] ?? []).length > 0);
}
const SPLIT_IN_BATCHES_NODE_TYPE = 'n8n-nodes-base.splitInBatches';
function reachesItself(connections, nodesByName, nodeName, avoid) {
    const seen = new Set();
    const queue = [nodeName];
    while (queue.length > 0) {
        const current = queue.shift();
        for (const edge of directChildren(connections, nodesByName, current)) {
            if (edge.node.name === nodeName)
                return true;
            if (avoid.has(edge.node.name) || seen.has(edge.node.name))
                continue;
            seen.add(edge.node.name);
            queue.push(edge.node.name);
        }
    }
    return false;
}
function findUncoveredAncestors(args) {
    const { nodes, connections, targetName, rootNames, runData } = args;
    const nodesByName = new Map(nodes.map((node) => [node.name, node]));
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(connections);
    const pinned = new Set(args.pinnedNodeNames ?? []);
    const ancestors = new Set(collectAncestorNames(nodes, connections, targetName, rootNames));
    if (ancestors.size === 0)
        return [];
    const failed = (name) => (runData[name] ?? []).some((task) => task.error !== undefined);
    const isClean = (name) => !failed(name) && (runData[name] !== undefined || pinned.has(name));
    const stopAt = new Set([...rootNames, targetName]);
    const isUnfinishedLoop = (name) => {
        if (nodesByName.get(name)?.type !== SPLIT_IN_BATCHES_NODE_TYPE)
            return false;
        const doneOutput = reachesItself(connections, nodesByName, name, stopAt) ? 0 : 1;
        const lastRun = runData[name]?.at(-1);
        return (lastRun?.data?.[n8n_workflow_1.NodeConnectionTypes.Main]?.[doneOutput] ?? []).length === 0;
    };
    const sources = [...ancestors].filter((name) => directParents(connectionsByDestination, nodesByName, name).length === 0);
    const startPoints = sources.filter((name) => isClean(name) && !isUnfinishedLoop(name));
    if (startPoints.length === 0)
        return [...ancestors];
    const uncovered = new Set();
    const seen = new Set(startPoints);
    const queue = [...startPoints];
    while (queue.length > 0) {
        const current = queue.shift();
        for (const edge of directChildren(connections, nodesByName, current)) {
            const child = edge.node.name;
            if (stopAt.has(child) || !ancestors.has(child))
                continue;
            if (!pinned.has(current) && !outputCarriedItems(runData, current, edge.outputIndex))
                continue;
            if (!isClean(child) || isUnfinishedLoop(child)) {
                uncovered.add(child);
                continue;
            }
            if (seen.has(child))
                continue;
            seen.add(child);
            queue.push(child);
        }
    }
    return [...uncovered];
}
function planStepRun(args) {
    const { nodes, connections, targetName, mockItems, priorRunData } = args;
    const rootNames = resolveStepRunRoots(nodes, connections, targetName);
    const throughRoots = rootNames.length === 1 && rootNames[0] === targetName
        ? undefined
        : { rootNodeNames: rootNames };
    if (mockItems !== undefined) {
        const { runData, mockedNodeNames } = buildMockedStepRunData({
            nodes,
            connections,
            targetName,
            mockItems,
            rootNames,
        });
        if (mockedNodeNames.length > 0) {
            const loopNames = new Set(nodes.filter((n) => n.type === SPLIT_IN_BATCHES_NODE_TYPE).map((n) => n.name));
            const notMocked = findUncoveredAncestors({
                nodes,
                connections,
                targetName,
                rootNames,
                runData,
            }).filter((name) => loopNames.has(name));
            if (notMocked.length > 0) {
                return {
                    inputMode: 'chain',
                    mockedNodeNames: [],
                    reusedNodeNames: [],
                    ...throughRoots,
                    unhonoredInput: { requested: 'mocked', upstreamNodeNames: notMocked },
                };
            }
            return {
                inputMode: 'mocked',
                runData,
                dirtyNodeNames: [targetName],
                mockedNodeNames,
                reusedNodeNames: [],
                ...throughRoots,
            };
        }
    }
    const ancestors = collectAncestorNames(nodes, connections, targetName, rootNames);
    let uncovered = [];
    if (priorRunData !== undefined) {
        const ancestorNames = new Set(ancestors);
        const reusedNodeNames = Object.keys(priorRunData).filter((name) => ancestorNames.has(name));
        uncovered = findUncoveredAncestors({
            nodes,
            connections,
            targetName,
            rootNames,
            runData: priorRunData,
            pinnedNodeNames: args.pinnedNodeNames,
        });
        if (reusedNodeNames.length > 0 && uncovered.length === 0) {
            return {
                inputMode: 'reused-execution',
                runData: priorRunData,
                dirtyNodeNames: [targetName],
                mockedNodeNames: [],
                reusedNodeNames,
                ...throughRoots,
            };
        }
    }
    return {
        inputMode: 'chain',
        mockedNodeNames: [],
        reusedNodeNames: [],
        ...throughRoots,
        ...(priorRunData !== undefined && ancestors.length > 0
            ? {
                unhonoredInput: {
                    requested: 'reused-execution',
                    upstreamNodeNames: uncovered.length > 0 ? uncovered : ancestors,
                },
            }
            : {}),
    };
}
function pinDataForStepRun(workflowPinData, args) {
    if (!workflowPinData)
        return undefined;
    const overridden = new Set([args.targetName, ...args.mockedNodeNames]);
    const kept = Object.entries(workflowPinData).filter(([nodeName]) => !overridden.has(nodeName));
    if (kept.length === Object.keys(workflowPinData).length)
        return workflowPinData;
    return Object.fromEntries(kept);
}
const TOOLKIT_NODE_TYPES = new Set([n8n_workflow_1.MCP_CLIENT_TOOL_NODE_TYPE]);
const MCP_REGISTRY_NODE_TYPE_PREFIX = `${mcp_registry_connection_1.MCP_REGISTRY_PACKAGE_NAME}.`;
function isToolkitNode(node) {
    return TOOLKIT_NODE_TYPES.has(node.type) || node.type.startsWith(MCP_REGISTRY_NODE_TYPE_PREFIX);
}
function declaredToolArguments(node) {
    const collected = [];
    (0, n8n_workflow_1.traverseNodeParameters)(node.parameters, collected);
    return [...new Set(collected.map((argument) => argument.key))];
}
const TOOL_NAME_PARAMETERS = ['name', 'toolName'];
function buildToolAgentRequest(args) {
    const { target } = args;
    const toolArguments = args.toolArguments ?? {};
    const names = new Set([(0, n8n_workflow_1.nodeNameToToolName)(target.name), target.name]);
    for (const parameter of TOOL_NAME_PARAMETERS) {
        const configured = target.parameters?.[parameter];
        if (typeof configured === 'string' && configured !== '')
            names.add(configured);
    }
    return {
        query: Object.fromEntries([...names].map((name) => [name, toolArguments])),
        tool: { name: '' },
    };
}
function toExecutionItems(items) {
    return items.map((json) => ({ json: (json ?? {}) }));
}
//# sourceMappingURL=instance-ai-step-run.js.map