"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSemanticGraph = buildSemanticGraph;
const n8n_workflow_1 = require("n8n-workflow");
const semantic_registry_1 = require("./semantic-registry");
const types_1 = require("./types");
const base_1 = require("../types/base");
const trigger_detection_1 = require("../utils/trigger-detection");
function createSemanticNode(nodeJson) {
    if (typeof nodeJson.typeVersion === 'string') {
        nodeJson.typeVersion = Number(nodeJson.typeVersion);
    }
    return {
        name: nodeJson.name ?? nodeJson.id,
        type: nodeJson.type,
        json: nodeJson,
        outputs: new Map(),
        inputSources: new Map(),
        subnodes: [],
        annotations: {
            isTrigger: (0, trigger_detection_1.isTriggerNodeType)(nodeJson.type),
            isCycleTarget: false,
            isConvergencePoint: false,
        },
    };
}
function isAiConnectionType(connType) {
    return types_1.AI_CONNECTION_TYPES.includes(connType);
}
function parseMainConnections(sourceName, outputs, graph) {
    const sourceNode = graph.nodes.get(sourceName);
    if (!sourceNode)
        return;
    outputs.forEach((targets, outputIndex) => {
        if (!targets)
            return;
        const outputName = (0, semantic_registry_1.getOutputName)(sourceNode.type, outputIndex, sourceNode.json);
        const connections = [];
        for (const target of targets) {
            const targetNode = graph.nodes.get(target.node);
            if (!targetNode) {
                continue;
            }
            const inputSlot = (0, semantic_registry_1.getInputName)(targetNode.type, target.index, targetNode.json);
            const sources = targetNode.inputSources.get(inputSlot) ?? [];
            sources.push({ from: sourceName, outputSlot: outputName });
            targetNode.inputSources.set(inputSlot, sources);
            connections.push({
                target: target.node,
                targetInputSlot: inputSlot,
            });
        }
        if (connections.length > 0) {
            sourceNode.outputs.set(outputName, connections);
        }
    });
}
function parseErrorConnections(sourceName, outputs, graph) {
    const sourceNode = graph.nodes.get(sourceName);
    if (!sourceNode)
        return;
    const connections = [];
    for (const targets of outputs) {
        if (!targets)
            continue;
        for (const target of targets) {
            const targetNode = graph.nodes.get(target.node);
            if (!targetNode)
                continue;
            const inputSlot = (0, semantic_registry_1.getInputName)(targetNode.type, target.index, targetNode.json);
            const sources = targetNode.inputSources.get(inputSlot) ?? [];
            sources.push({ from: sourceName, outputSlot: 'error' });
            targetNode.inputSources.set(inputSlot, sources);
            connections.push({
                target: target.node,
                targetInputSlot: inputSlot,
            });
        }
    }
    if (connections.length > 0) {
        sourceNode.outputs.set('error', connections);
    }
}
function parseAiConnections(sourceName, connectionType, outputs, graph) {
    const sourceNode = graph.nodes.get(sourceName);
    if (!sourceNode)
        return;
    outputs.forEach((targets) => {
        if (!targets)
            return;
        targets.forEach((target) => {
            const parentNode = graph.nodes.get(target.node);
            if (!parentNode)
                return;
            parentNode.subnodes.push({
                connectionType,
                subnodeName: sourceName,
                index: target.index,
            });
        });
    });
}
function identifyRoots(graph) {
    const roots = [];
    const hasIncomingConnections = new Set();
    for (const [, node] of graph.nodes) {
        for (const [, connections] of node.outputs) {
            for (const conn of connections) {
                hasIncomingConnections.add(conn.target);
            }
        }
    }
    const subnodeNames = new Set();
    for (const [, node] of graph.nodes) {
        for (const subnode of node.subnodes) {
            subnodeNames.add(subnode.subnodeName);
        }
    }
    for (const [name, node] of graph.nodes) {
        if (subnodeNames.has(name)) {
            continue;
        }
        if (node.annotations.isTrigger || !hasIncomingConnections.has(name)) {
            roots.push(name);
        }
    }
    return roots;
}
function markReachable(start, scope, graph, processed) {
    const stack = [start];
    while (stack.length > 0) {
        const current = stack.pop();
        if (processed.has(current))
            continue;
        processed.add(current);
        const node = graph.nodes.get(current);
        if (!node)
            continue;
        for (const [, conns] of node.outputs) {
            for (const conn of conns) {
                if (scope.has(conn.target) && !processed.has(conn.target)) {
                    stack.push(conn.target);
                }
            }
        }
    }
}
function findDisconnectedRoots(graph) {
    const subnodeNames = new Set();
    for (const [, node] of graph.nodes) {
        for (const subnode of node.subnodes) {
            subnodeNames.add(subnode.subnodeName);
        }
    }
    const reachable = new Set();
    const stack = [...graph.roots];
    while (stack.length > 0) {
        const nodeName = stack.pop();
        if (reachable.has(nodeName))
            continue;
        reachable.add(nodeName);
        const node = graph.nodes.get(nodeName);
        if (!node)
            continue;
        for (const [, connections] of node.outputs) {
            for (const conn of connections) {
                if (!reachable.has(conn.target)) {
                    stack.push(conn.target);
                }
            }
        }
    }
    const disconnected = new Set();
    for (const [name] of graph.nodes) {
        if (!reachable.has(name) && !subnodeNames.has(name)) {
            disconnected.add(name);
        }
    }
    if (disconnected.size === 0)
        return [];
    const incomingFromDisconnected = new Map();
    for (const name of disconnected) {
        incomingFromDisconnected.set(name, new Set());
    }
    for (const nodeName of disconnected) {
        const node = graph.nodes.get(nodeName);
        if (!node)
            continue;
        for (const [, connections] of node.outputs) {
            for (const conn of connections) {
                if (disconnected.has(conn.target) && conn.target !== nodeName) {
                    incomingFromDisconnected.get(conn.target).add(nodeName);
                }
            }
        }
    }
    const entryPoints = [];
    const processed = new Set();
    for (const nodeName of disconnected) {
        if (processed.has(nodeName))
            continue;
        if (incomingFromDisconnected.get(nodeName).size === 0) {
            entryPoints.push(nodeName);
            markReachable(nodeName, disconnected, graph, processed);
        }
    }
    for (const nodeName of disconnected) {
        if (!processed.has(nodeName)) {
            entryPoints.push(nodeName);
            markReachable(nodeName, disconnected, graph, processed);
        }
    }
    return entryPoints;
}
function buildSemanticGraph(json) {
    const graph = {
        nodes: new Map(),
        roots: [],
        cycleEdges: new Map(),
    };
    const unnamedCounters = new Map();
    for (const rawNode of json.nodes) {
        const nodeJson = { ...rawNode };
        let nodeName = nodeJson.name;
        if (nodeName === undefined || nodeName === '') {
            const typeSuffix = nodeJson.type.split('.').pop() ?? 'node';
            const counter = (unnamedCounters.get(typeSuffix) ?? 0) + 1;
            unnamedCounters.set(typeSuffix, counter);
            nodeName = `__unnamed_${typeSuffix}_${counter}__`;
        }
        else if (graph.nodes.has(nodeName)) {
            nodeName = (0, base_1.generateUniqueName)(nodeName, (n) => graph.nodes.has(n));
        }
        const semanticNode = createSemanticNode(nodeJson);
        semanticNode.name = nodeName;
        graph.nodes.set(nodeName, semanticNode);
    }
    const connections = (0, n8n_workflow_1.deepCopy)(json.connections);
    (0, base_1.normalizeConnections)(connections);
    for (const [sourceName, connectionTypes] of Object.entries(connections)) {
        for (const [connType, outputs] of Object.entries(connectionTypes)) {
            const typedOutputs = outputs;
            if (connType === 'main') {
                parseMainConnections(sourceName, typedOutputs, graph);
            }
            else if (connType === 'error') {
                parseErrorConnections(sourceName, typedOutputs, graph);
            }
            else if (isAiConnectionType(connType)) {
                parseAiConnections(sourceName, connType, typedOutputs, graph);
            }
        }
    }
    for (const [, node] of graph.nodes) {
        node.subnodes.sort((a, b) => a.index - b.index);
    }
    graph.roots = identifyRoots(graph);
    const disconnectedRoots = findDisconnectedRoots(graph);
    graph.roots.push(...disconnectedRoots);
    return graph;
}
//# sourceMappingURL=semantic-graph.js.map