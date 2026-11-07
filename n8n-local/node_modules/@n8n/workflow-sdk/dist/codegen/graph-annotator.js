"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.annotateGraph = annotateGraph;
function detectCycles(graph) {
    const visiting = new Set();
    const visited = new Set();
    function dfs(nodeName, ancestors) {
        if (visited.has(nodeName))
            return;
        if (visiting.has(nodeName))
            return;
        visiting.add(nodeName);
        const newAncestors = new Set(ancestors);
        newAncestors.add(nodeName);
        const node = graph.nodes.get(nodeName);
        if (!node) {
            visiting.delete(nodeName);
            visited.add(nodeName);
            return;
        }
        for (const [, connections] of node.outputs) {
            for (const conn of connections) {
                if (ancestors.has(conn.target)) {
                    const targetNode = graph.nodes.get(conn.target);
                    if (targetNode) {
                        targetNode.annotations.isCycleTarget = true;
                    }
                    const edges = graph.cycleEdges.get(nodeName) ?? [];
                    edges.push(conn.target);
                    graph.cycleEdges.set(nodeName, edges);
                }
                else if (!visited.has(conn.target)) {
                    dfs(conn.target, newAncestors);
                }
            }
        }
        visiting.delete(nodeName);
        visited.add(nodeName);
    }
    for (const rootName of graph.roots) {
        const ancestors = new Set();
        dfs(rootName, ancestors);
    }
    for (const [nodeName] of graph.nodes) {
        if (!visited.has(nodeName)) {
            const ancestors = new Set();
            dfs(nodeName, ancestors);
        }
    }
}
function collectReachable(startName, graph, visited = new Set()) {
    if (visited.has(startName))
        return visited;
    visited.add(startName);
    const node = graph.nodes.get(startName);
    if (!node)
        return visited;
    for (const [, connections] of node.outputs) {
        for (const conn of connections) {
            collectReachable(conn.target, graph, visited);
        }
    }
    return visited;
}
function findConvergenceNodes(graph) {
    for (const [, node] of graph.nodes) {
        if (node.outputs.size <= 1)
            continue;
        const branchOutputs = [];
        for (const [, connections] of node.outputs) {
            if (connections.length > 0) {
                const branchTargets = connections.map((c) => c.target);
                branchOutputs.push(branchTargets);
            }
        }
        if (branchOutputs.length < 2)
            continue;
        const branchReachable = [];
        for (const branchTargets of branchOutputs) {
            const reachable = new Set();
            for (const target of branchTargets) {
                collectReachable(target, graph, reachable);
            }
            branchReachable.push(reachable);
        }
        const allReachable = new Set();
        for (const reachable of branchReachable) {
            for (const nodeName of reachable) {
                allReachable.add(nodeName);
            }
        }
        for (const nodeName of allReachable) {
            const reachedByCount = branchReachable.filter((set) => set.has(nodeName)).length;
            if (reachedByCount >= 2) {
                const targetNode = graph.nodes.get(nodeName);
                if (targetNode) {
                    targetNode.annotations.isConvergencePoint = true;
                }
            }
        }
    }
}
function annotateGraph(graph) {
    detectCycles(graph);
    findConvergenceNodes(graph);
}
//# sourceMappingURL=graph-annotator.js.map