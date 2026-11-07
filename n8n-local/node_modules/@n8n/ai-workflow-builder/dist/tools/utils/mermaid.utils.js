"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mermaidStringify = mermaidStringify;
exports.processWorkflowExamples = processWorkflowExamples;
const node_configuration_utils_1 = require("./node-configuration.utils");
const DEFAULT_MERMAID_OPTIONS = {
    includeNodeType: true,
    includeNodeParameters: true,
    includeNodeName: true,
    includeNodeId: true,
    collectNodeConfigurations: false,
};
const CONDITIONAL_NODE_TYPES = new Set([
    'n8n-nodes-base.if',
    'n8n-nodes-base.switch',
    'n8n-nodes-base.filter',
]);
const AGENT_NODE_TYPE = '@n8n/n8n-nodes-langchain.agent';
const STICKY_NOTE_TYPE = 'n8n-nodes-base.stickyNote';
const DEFAULT_NODE_WIDTH = 100;
const DEFAULT_NODE_HEIGHT = 100;
const DEFAULT_STICKY_WIDTH = 150;
const DEFAULT_STICKY_HEIGHT = 80;
class MermaidBuilder {
    nodes;
    connections;
    options;
    nodeConfigurations;
    nodeIdMap;
    nodeByName;
    stickyOverlaps;
    agentSubgraphs;
    nodesInSubgraphs;
    definedNodes = new Set();
    lines = [];
    subgraphCounter = 0;
    constructor(nodes, connections, options, existingConfigurations) {
        const regularNodes = nodes.filter((n) => n.type !== STICKY_NOTE_TYPE);
        const stickyNotes = nodes.filter((n) => n.type === STICKY_NOTE_TYPE);
        this.nodes = regularNodes;
        this.connections = connections;
        this.options = options;
        this.nodeConfigurations = existingConfigurations ?? {};
        this.nodeIdMap = this.createNodeIdMap();
        this.nodeByName = new Map(regularNodes.map((n) => [n.name, n]));
        this.stickyOverlaps = this.categorizeStickyOverlaps(stickyNotes);
        const nodesInStickySubgraphs = new Set();
        for (const { nodeNames } of this.stickyOverlaps.multiNodeOverlap) {
            for (const name of nodeNames) {
                nodesInStickySubgraphs.add(name);
            }
        }
        this.agentSubgraphs = this.findAgentSubgraphs(nodesInStickySubgraphs);
        this.nodesInSubgraphs = new Set(nodesInStickySubgraphs);
        for (const { agentNode, aiConnectedNodeNames } of this.agentSubgraphs) {
            this.nodesInSubgraphs.add(agentNode.name);
            for (const name of aiConnectedNodeNames) {
                this.nodesInSubgraphs.add(name);
            }
        }
    }
    build() {
        for (const sticky of this.stickyOverlaps.noOverlap) {
            this.lines.push(this.formatStickyComment(sticky.content));
        }
        this.buildMainFlow();
        this.buildStickySubgraphs();
        this.buildAgentSubgraphs();
        this.buildConnectionsToSubgraphs();
        this.buildConnectionsFromSubgraphs();
        this.buildInterSubgraphConnections();
        return {
            lines: ['```mermaid', 'flowchart TD', ...this.lines, '```'],
            nodeConfigurations: this.nodeConfigurations,
        };
    }
    createNodeIdMap() {
        const map = new Map();
        this.nodes.forEach((node, idx) => {
            map.set(node.name, `n${idx + 1}`);
        });
        return map;
    }
    categorizeStickyOverlaps(stickyNotes) {
        const result = {
            noOverlap: [],
            singleNodeOverlap: new Map(),
            multiNodeOverlap: [],
        };
        for (const sticky of stickyNotes) {
            const bounds = this.extractStickyBounds(sticky);
            if (!bounds.content)
                continue;
            const overlappingNodes = this.nodes.filter((node) => this.isNodeWithinStickyBounds(node.position[0], node.position[1], bounds));
            if (overlappingNodes.length === 0) {
                result.noOverlap.push(bounds);
            }
            else if (overlappingNodes.length === 1) {
                result.singleNodeOverlap.set(overlappingNodes[0].name, bounds);
            }
            else {
                result.multiNodeOverlap.push({
                    sticky: bounds,
                    nodeNames: overlappingNodes.map((n) => n.name),
                });
            }
        }
        return result;
    }
    extractStickyBounds(node) {
        return {
            node,
            x: node.position[0],
            y: node.position[1],
            width: typeof node.parameters.width === 'number' ? node.parameters.width : DEFAULT_STICKY_WIDTH,
            height: typeof node.parameters.height === 'number' ? node.parameters.height : DEFAULT_STICKY_HEIGHT,
            content: typeof node.parameters.content === 'string' ? node.parameters.content.trim() : '',
        };
    }
    isNodeWithinStickyBounds(nodeX, nodeY, sticky) {
        const nodeCenterX = nodeX + DEFAULT_NODE_WIDTH / 2;
        const nodeCenterY = nodeY + DEFAULT_NODE_HEIGHT / 2;
        return (nodeCenterX >= sticky.x &&
            nodeCenterX <= sticky.x + sticky.width &&
            nodeCenterY >= sticky.y &&
            nodeCenterY <= sticky.y + sticky.height);
    }
    findAgentSubgraphs(nodesInStickySubgraphs) {
        const agentSubgraphs = [];
        const agentNodes = this.nodes.filter((n) => n.type === AGENT_NODE_TYPE && !nodesInStickySubgraphs.has(n.name));
        const reverseConnections = this.buildReverseConnectionMap();
        for (const agentNode of agentNodes) {
            const incomingConns = reverseConnections.get(agentNode.name) ?? [];
            const aiConnectedNodeNames = incomingConns
                .filter(({ connType, sourceName }) => connType !== 'main' && !nodesInStickySubgraphs.has(sourceName))
                .map(({ sourceName }) => sourceName);
            const nestedStickySubgraphs = this.findNestedStickySubgraphs(incomingConns);
            if (aiConnectedNodeNames.length > 0 || nestedStickySubgraphs.length > 0) {
                agentSubgraphs.push({ agentNode, aiConnectedNodeNames, nestedStickySubgraphs });
            }
        }
        return agentSubgraphs;
    }
    findNestedStickySubgraphs(incomingConns) {
        const nested = [];
        for (const stickySubgraph of this.stickyOverlaps.multiNodeOverlap) {
            const allNodesConnectToAgent = stickySubgraph.nodeNames.every((nodeName) => incomingConns.some(({ sourceName, connType }) => sourceName === nodeName && connType !== 'main'));
            if (allNodesConnectToAgent) {
                nested.push(stickySubgraph);
            }
        }
        return nested;
    }
    buildReverseConnectionMap() {
        const reverseConnections = new Map();
        for (const [sourceName, sourceConns] of Object.entries(this.connections)) {
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(sourceConns)) {
                if (!reverseConnections.has(targetName)) {
                    reverseConnections.set(targetName, []);
                }
                reverseConnections.get(targetName).push({ sourceName, connType });
            }
        }
        return reverseConnections;
    }
    getConnectionTargets(nodeConns) {
        const targets = [];
        for (const [connType, connList] of Object.entries(nodeConns)) {
            for (const connArray of connList) {
                if (!connArray)
                    continue;
                for (const conn of connArray) {
                    targets.push({ nodeName: conn.node, connType });
                }
            }
        }
        return targets;
    }
    getMainConnectionTargets(nodeConns) {
        if (!nodeConns.main)
            return [];
        return nodeConns.main
            .filter((connArray) => connArray !== null)
            .flatMap((connArray) => connArray.map((conn) => conn.node));
    }
    findStartNodes() {
        const nodesWithIncoming = new Set();
        Object.values(this.connections)
            .filter((conn) => conn.main)
            .forEach((sourceConnections) => {
            for (const connArray of sourceConnections.main) {
                if (!connArray)
                    continue;
                for (const conn of connArray) {
                    nodesWithIncoming.add(conn.node);
                }
            }
        });
        return this.nodes.filter((n) => !nodesWithIncoming.has(n.name));
    }
    formatStickyComment(content) {
        return `%% ${content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()}`;
    }
    getNextSubgraphId() {
        this.subgraphCounter++;
        return `sg${this.subgraphCounter}`;
    }
    buildNodeDefinition(node, id) {
        const isConditional = CONDITIONAL_NODE_TYPES.has(node.type);
        if (this.options.includeNodeName) {
            const escapedName = node.name.replace(/"/g, "'");
            return isConditional ? `${id}{"${escapedName}"}` : `${id}["${escapedName}"]`;
        }
        return id;
    }
    buildNodeCommentLines(node) {
        const lines = [];
        if (this.options.collectNodeConfigurations) {
            const config = (0, node_configuration_utils_1.collectSingleNodeConfiguration)(node);
            if (config) {
                (0, node_configuration_utils_1.addNodeConfigurationToMap)(node.type, config, this.nodeConfigurations);
            }
        }
        if (this.options.includeNodeType ||
            this.options.includeNodeParameters ||
            this.options.includeNodeId) {
            const idPart = this.options.includeNodeId && node.id ? `[${node.id}] ` : '';
            const typePart = this.options.includeNodeType ? this.buildNodeTypePart(node) : '';
            const paramsPart = this.options.includeNodeParameters && Object.keys(node.parameters).length > 0
                ? ` | ${JSON.stringify(node.parameters)}`
                : '';
            if (idPart || typePart || paramsPart) {
                lines.push(`%% ${idPart}${typePart}${paramsPart}`);
            }
        }
        return lines;
    }
    buildNodeTypePart(node) {
        const parts = [node.type];
        if (typeof node.parameters.resource === 'string' && node.parameters.resource) {
            parts.push(node.parameters.resource);
        }
        if (typeof node.parameters.operation === 'string' && node.parameters.operation) {
            parts.push(node.parameters.operation);
        }
        return parts.join(':');
    }
    buildSingleNodeLines(node, id) {
        const lines = this.buildNodeCommentLines(node);
        lines.push(this.buildNodeDefinition(node, id));
        return lines;
    }
    defineNodeIfNeeded(nodeName) {
        const node = this.nodeByName.get(nodeName);
        const id = this.nodeIdMap.get(nodeName);
        if (!node || !id)
            return id ?? '';
        if (!this.definedNodes.has(nodeName)) {
            this.definedNodes.add(nodeName);
            const stickyForNode = this.stickyOverlaps.singleNodeOverlap.get(nodeName);
            if (stickyForNode) {
                this.lines.push(this.formatStickyComment(stickyForNode.content));
            }
            this.lines.push(...this.buildNodeCommentLines(node));
            return this.buildNodeDefinition(node, id);
        }
        return id;
    }
    defineTargetAndConnect(sourceId, targetName, connType) {
        const targetId = this.nodeIdMap.get(targetName);
        if (!targetId)
            return false;
        if (!this.definedNodes.has(targetName)) {
            const targetNode = this.nodeByName.get(targetName);
            if (targetNode) {
                const stickyForNode = this.stickyOverlaps.singleNodeOverlap.get(targetName);
                if (stickyForNode) {
                    this.lines.push(this.formatStickyComment(stickyForNode.content));
                }
                this.lines.push(...this.buildNodeCommentLines(targetNode));
                this.addConnection(sourceId, this.buildNodeDefinition(targetNode, targetId), connType);
                this.definedNodes.add(targetName);
                return connType === 'main';
            }
        }
        else {
            this.addConnection(sourceId, targetId, connType);
        }
        return false;
    }
    addConnection(sourceId, targetDef, connType) {
        const arrow = connType === 'main' ? '-->' : `-.${connType}.->`;
        this.lines.push(`${sourceId} ${arrow} ${targetDef}`);
    }
    buildMainFlow() {
        const visited = new Set();
        const startNodes = this.findStartNodes();
        const traverse = (nodeName) => {
            if (visited.has(nodeName))
                return;
            visited.add(nodeName);
            const nodeConns = this.connections[nodeName];
            const targets = nodeConns ? this.getConnectionTargets(nodeConns) : [];
            for (const { nodeName: targetName, connType } of targets) {
                if (this.nodesInSubgraphs.has(targetName) || this.nodesInSubgraphs.has(nodeName))
                    continue;
                const sourceId = this.nodeIdMap.get(nodeName);
                const targetDef = this.defineNodeIfNeeded(targetName);
                if (sourceId) {
                    this.addConnection(sourceId, targetDef, connType);
                }
            }
            if (nodeConns) {
                this.getMainConnectionTargets(nodeConns)
                    .filter((target) => !this.nodesInSubgraphs.has(target))
                    .forEach((target) => traverse(target));
            }
        };
        for (const startNode of startNodes) {
            if (this.nodesInSubgraphs.has(startNode.name))
                continue;
            const id = this.nodeIdMap.get(startNode.name);
            if (id && !this.definedNodes.has(startNode.name)) {
                const stickyForNode = this.stickyOverlaps.singleNodeOverlap.get(startNode.name);
                if (stickyForNode) {
                    this.lines.push(this.formatStickyComment(stickyForNode.content));
                }
                this.lines.push(...this.buildSingleNodeLines(startNode, id));
                this.definedNodes.add(startNode.name);
            }
            traverse(startNode.name);
        }
    }
    buildStickySubgraphs() {
        const nestedStickyIds = this.getNestedStickyIds();
        for (const { sticky, nodeNames } of this.stickyOverlaps.multiNodeOverlap) {
            if (nestedStickyIds.has(sticky.node.id ?? ''))
                continue;
            this.buildSingleStickySubgraph(sticky, nodeNames);
        }
    }
    getNestedStickyIds() {
        const ids = new Set();
        for (const { nestedStickySubgraphs } of this.agentSubgraphs) {
            for (const { sticky } of nestedStickySubgraphs) {
                ids.add(sticky.node.id ?? '');
            }
        }
        return ids;
    }
    buildSingleStickySubgraph(sticky, nodeNames) {
        const subgraphId = this.getNextSubgraphId();
        const subgraphLabel = sticky.content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        this.lines.push(this.formatStickyComment(sticky.content));
        this.lines.push(`subgraph ${subgraphId}["${subgraphLabel.replace(/"/g, "'")}"]`);
        const subgraphNodeSet = new Set(nodeNames);
        const subgraphDefinedNodes = new Set();
        const startNodes = this.findSubgraphStartNodes(nodeNames, subgraphNodeSet);
        for (const startNode of startNodes) {
            const id = this.nodeIdMap.get(startNode.name);
            if (id && !subgraphDefinedNodes.has(startNode.name)) {
                this.lines.push(...this.buildSingleNodeLines(startNode, id));
                subgraphDefinedNodes.add(startNode.name);
            }
        }
        this.buildSubgraphInternalConnections(startNodes, subgraphNodeSet, subgraphDefinedNodes);
        for (const name of nodeNames) {
            this.definedNodes.add(name);
        }
        this.lines.push('end');
    }
    findSubgraphStartNodes(nodeNames, subgraphNodeSet) {
        const nodesWithInternalIncoming = new Set();
        for (const nodeName of nodeNames) {
            const nodeConns = this.connections[nodeName];
            if (!nodeConns)
                continue;
            for (const { nodeName: targetName } of this.getConnectionTargets(nodeConns)) {
                if (subgraphNodeSet.has(targetName)) {
                    nodesWithInternalIncoming.add(targetName);
                }
            }
        }
        return nodeNames
            .filter((name) => !nodesWithInternalIncoming.has(name))
            .map((name) => this.nodeByName.get(name))
            .filter((node) => node !== undefined);
    }
    buildSubgraphInternalConnections(startNodes, subgraphNodeSet, subgraphDefinedNodes) {
        const visited = new Set();
        const traverse = (nodeName) => {
            if (visited.has(nodeName))
                return;
            visited.add(nodeName);
            const nodeConns = this.connections[nodeName];
            if (!nodeConns)
                return;
            const sourceId = this.nodeIdMap.get(nodeName);
            if (!sourceId)
                return;
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(nodeConns)) {
                if (!subgraphNodeSet.has(targetName))
                    continue;
                const targetId = this.nodeIdMap.get(targetName);
                const targetNode = this.nodeByName.get(targetName);
                if (!targetId || !targetNode)
                    continue;
                const arrow = connType === 'main' ? '-->' : `-.${connType}.->`;
                if (!subgraphDefinedNodes.has(targetName)) {
                    this.lines.push(...this.buildNodeCommentLines(targetNode));
                    this.lines.push(`${sourceId} ${arrow} ${this.buildNodeDefinition(targetNode, targetId)}`);
                    subgraphDefinedNodes.add(targetName);
                }
                else {
                    this.lines.push(`${sourceId} ${arrow} ${targetId}`);
                }
            }
            this.getMainConnectionTargets(nodeConns)
                .filter((t) => subgraphNodeSet.has(t))
                .forEach((t) => traverse(t));
        };
        startNodes.forEach((n) => traverse(n.name));
    }
    buildAgentSubgraphs() {
        for (const agentSubgraph of this.agentSubgraphs) {
            this.buildSingleAgentSubgraph(agentSubgraph);
        }
    }
    buildSingleAgentSubgraph(agentSubgraph) {
        const { agentNode, aiConnectedNodeNames, nestedStickySubgraphs } = agentSubgraph;
        const agentId = this.nodeIdMap.get(agentNode.name);
        if (!agentId)
            return;
        const subgraphId = this.getNextSubgraphId();
        this.lines.push(`subgraph ${subgraphId}["${agentNode.name.replace(/"/g, "'")}"]`);
        for (const nodeName of aiConnectedNodeNames) {
            this.defineAgentConnectedNode(nodeName);
        }
        for (const { sticky, nodeNames } of nestedStickySubgraphs) {
            this.buildNestedStickySubgraph(sticky, nodeNames);
        }
        this.buildAgentNodeConnections(agentNode, agentId, aiConnectedNodeNames, nestedStickySubgraphs);
        this.markAgentSubgraphNodesDefined(agentNode, aiConnectedNodeNames, nestedStickySubgraphs);
        this.lines.push('end');
    }
    defineAgentConnectedNode(nodeName) {
        const node = this.nodeByName.get(nodeName);
        const id = this.nodeIdMap.get(nodeName);
        if (!node || !id)
            return;
        const stickyForNode = this.stickyOverlaps.singleNodeOverlap.get(nodeName);
        if (stickyForNode) {
            this.lines.push(this.formatStickyComment(stickyForNode.content));
        }
        this.lines.push(...this.buildSingleNodeLines(node, id));
    }
    buildNestedStickySubgraph(sticky, nodeNames) {
        const nestedSubgraphId = this.getNextSubgraphId();
        const label = sticky.content.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
        this.lines.push(this.formatStickyComment(sticky.content));
        this.lines.push(`subgraph ${nestedSubgraphId}["${label.replace(/"/g, "'")}"]`);
        for (const nodeName of nodeNames) {
            const node = this.nodeByName.get(nodeName);
            const id = this.nodeIdMap.get(nodeName);
            if (node && id) {
                this.lines.push(...this.buildSingleNodeLines(node, id));
            }
        }
        this.lines.push('end');
    }
    buildAgentNodeConnections(agentNode, agentId, aiConnectedNodeNames, nestedStickySubgraphs) {
        const stickyForAgent = this.stickyOverlaps.singleNodeOverlap.get(agentNode.name);
        if (stickyForAgent) {
            this.lines.push(this.formatStickyComment(stickyForAgent.content));
        }
        this.lines.push(...this.buildNodeCommentLines(agentNode));
        const allAiNodeNames = [
            ...aiConnectedNodeNames,
            ...nestedStickySubgraphs.flatMap(({ nodeNames }) => nodeNames),
        ];
        let agentDefined = false;
        for (const nodeName of allAiNodeNames) {
            const sourceId = this.nodeIdMap.get(nodeName);
            const nodeConns = this.connections[nodeName];
            if (!sourceId || !nodeConns)
                continue;
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(nodeConns)) {
                if (targetName !== agentNode.name || connType === 'main')
                    continue;
                const arrow = `-.${connType}.->`;
                if (!agentDefined) {
                    this.lines.push(`${sourceId} ${arrow} ${this.buildNodeDefinition(agentNode, agentId)}`);
                    agentDefined = true;
                }
                else {
                    this.lines.push(`${sourceId} ${arrow} ${agentId}`);
                }
            }
        }
        if (!agentDefined) {
            this.lines.push(this.buildNodeDefinition(agentNode, agentId));
        }
    }
    markAgentSubgraphNodesDefined(agentNode, aiConnectedNodeNames, nestedStickySubgraphs) {
        for (const name of aiConnectedNodeNames) {
            this.definedNodes.add(name);
        }
        for (const { nodeNames } of nestedStickySubgraphs) {
            for (const name of nodeNames) {
                this.definedNodes.add(name);
            }
        }
        this.definedNodes.add(agentNode.name);
    }
    buildConnectionsToSubgraphs() {
        for (const nodeName of this.definedNodes) {
            if (this.nodesInSubgraphs.has(nodeName))
                continue;
            const nodeConns = this.connections[nodeName];
            if (!nodeConns)
                continue;
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(nodeConns)) {
                if (this.nodesInSubgraphs.has(targetName)) {
                    const sourceId = this.nodeIdMap.get(nodeName);
                    const targetId = this.nodeIdMap.get(targetName);
                    if (sourceId && targetId) {
                        this.addConnection(sourceId, targetId, connType);
                    }
                }
            }
        }
    }
    buildConnectionsFromSubgraphs() {
        const nodesToProcess = [];
        for (const nodeName of this.nodesInSubgraphs) {
            const nodeConns = this.connections[nodeName];
            if (!nodeConns)
                continue;
            const sourceId = this.nodeIdMap.get(nodeName);
            if (!sourceId)
                continue;
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(nodeConns)) {
                if (this.nodesInSubgraphs.has(targetName))
                    continue;
                const wasNewMainConnection = this.defineTargetAndConnect(sourceId, targetName, connType);
                if (wasNewMainConnection) {
                    nodesToProcess.push(targetName);
                }
            }
        }
        this.continueTraversalFromNodes(nodesToProcess);
    }
    continueTraversalFromNodes(nodesToProcess) {
        const visited = new Set();
        const traverse = (nodeName) => {
            if (visited.has(nodeName) || this.nodesInSubgraphs.has(nodeName))
                return;
            visited.add(nodeName);
            const nodeConns = this.connections[nodeName];
            if (!nodeConns)
                return;
            const sourceId = this.nodeIdMap.get(nodeName);
            if (!sourceId)
                return;
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(nodeConns)) {
                if (this.nodesInSubgraphs.has(targetName)) {
                    const targetId = this.nodeIdMap.get(targetName);
                    if (targetId) {
                        this.addConnection(sourceId, targetId, connType);
                    }
                    continue;
                }
                this.defineTargetAndConnect(sourceId, targetName, connType);
            }
            this.getMainConnectionTargets(nodeConns)
                .filter((t) => !this.nodesInSubgraphs.has(t))
                .forEach((t) => traverse(t));
        };
        nodesToProcess.forEach((n) => traverse(n));
    }
    buildInterSubgraphConnections() {
        const nestedStickyIds = this.getNestedStickyIds();
        const outputConnections = new Set();
        for (const nodeName of this.nodesInSubgraphs) {
            const nodeConns = this.connections[nodeName];
            if (!nodeConns)
                continue;
            for (const { nodeName: targetName, connType } of this.getConnectionTargets(nodeConns)) {
                if (!this.nodesInSubgraphs.has(targetName))
                    continue;
                if (this.isInNestedSticky(nodeName, nestedStickyIds))
                    continue;
                if (this.isInNestedSticky(targetName, nestedStickyIds))
                    continue;
                const sourceSubgraphId = this.getSubgraphId(nodeName, nestedStickyIds);
                const targetSubgraphId = this.getSubgraphId(targetName, nestedStickyIds);
                if (sourceSubgraphId === targetSubgraphId)
                    continue;
                const sourceId = this.nodeIdMap.get(nodeName);
                const targetId = this.nodeIdMap.get(targetName);
                if (!sourceId || !targetId)
                    continue;
                const connKey = `${sourceId}-${connType}-${targetId}`;
                if (outputConnections.has(connKey))
                    continue;
                outputConnections.add(connKey);
                this.addConnection(sourceId, targetId, connType);
            }
        }
    }
    isInNestedSticky(nodeName, nestedStickyIds) {
        return this.stickyOverlaps.multiNodeOverlap.some(({ sticky, nodeNames }) => nodeNames.includes(nodeName) && nestedStickyIds.has(sticky.node.id ?? ''));
    }
    getSubgraphId(nodeName, nestedStickyIds) {
        const stickySubgraph = this.stickyOverlaps.multiNodeOverlap.find(({ sticky, nodeNames }) => nodeNames.includes(nodeName) && !nestedStickyIds.has(sticky.node.id ?? ''));
        if (stickySubgraph) {
            return `sticky:${stickySubgraph.sticky.node.id}`;
        }
        const agentSubgraph = this.agentSubgraphs.find(({ agentNode, aiConnectedNodeNames }) => agentNode.name === nodeName || aiConnectedNodeNames.includes(nodeName));
        if (agentSubgraph) {
            return `agent:${agentSubgraph.agentNode.id}`;
        }
        return 'none';
    }
}
function mermaidStringify(input, options) {
    const { workflow: wf } = input;
    const mergedOptions = {
        ...DEFAULT_MERMAID_OPTIONS,
        ...options,
    };
    const builder = new MermaidBuilder(wf.nodes, wf.connections, mergedOptions);
    const result = builder.build();
    return result.lines.join('\n');
}
function processWorkflowExamples(workflows, options) {
    const mergedOptions = {
        ...DEFAULT_MERMAID_OPTIONS,
        ...options,
        collectNodeConfigurations: true,
    };
    const allConfigurations = {};
    return workflows.map((workflow) => {
        const { workflow: wf } = workflow;
        const builder = new MermaidBuilder(wf.nodes, wf.connections, mergedOptions, allConfigurations);
        const result = builder.build();
        return {
            mermaid: result.lines.join('\n'),
            nodeConfigurations: result.nodeConfigurations,
        };
    });
}
//# sourceMappingURL=mermaid.utils.js.map