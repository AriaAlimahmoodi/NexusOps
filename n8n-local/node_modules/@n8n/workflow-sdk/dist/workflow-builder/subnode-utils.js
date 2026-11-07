"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addNodeWithSubnodes = addNodeWithSubnodes;
function resolveSubnodeName(subnode) {
    return subnode.name || subnode.config?.name;
}
function generateUniqueName(nodes, baseName) {
    if (!nodes.has(baseName)) {
        return baseName;
    }
    let counter = 1;
    let newName = `${baseName} ${counter}`;
    while (nodes.has(newName)) {
        counter++;
        newName = `${baseName} ${counter}`;
    }
    return newName;
}
function addSingleSubnode(nodes, subnode, connectionType, index, parentName) {
    const subnodeName = resolveSubnodeName(subnode);
    if (!subnodeName)
        return;
    const existingSubnode = nodes.get(subnodeName);
    if (existingSubnode) {
        let existingAiConns = existingSubnode.connections.get(connectionType);
        if (!existingAiConns) {
            existingAiConns = new Map();
            existingSubnode.connections.set(connectionType, existingAiConns);
        }
        const existingOutputConns = existingAiConns.get(0) ?? [];
        existingAiConns.set(0, [
            ...existingOutputConns,
            { node: parentName, type: connectionType, index },
        ]);
        return;
    }
    const subnodeConns = new Map();
    subnodeConns.set('main', new Map());
    const aiConnMap = new Map();
    aiConnMap.set(0, [{ node: parentName, type: connectionType, index }]);
    subnodeConns.set(connectionType, aiConnMap);
    nodes.set(subnodeName, {
        instance: subnode,
        connections: subnodeConns,
    });
    const nestedSubnodes = subnode.config?.subnodes;
    if (nestedSubnodes) {
        processSubnodes(nodes, subnodeName, nestedSubnodes);
    }
}
function addSubnodeOrArray(nodes, subnodeOrArray, connectionType, parentName) {
    if (!subnodeOrArray)
        return;
    if (Array.isArray(subnodeOrArray)) {
        if (subnodeOrArray.length > 0 && Array.isArray(subnodeOrArray[0])) {
            const slots = subnodeOrArray;
            for (let slotIdx = 0; slotIdx < slots.length; slotIdx++) {
                for (const sub of slots[slotIdx]) {
                    addSingleSubnode(nodes, sub, connectionType, slotIdx, parentName);
                }
            }
        }
        else {
            const items = subnodeOrArray;
            for (let i = 0; i < items.length; i++) {
                addSingleSubnode(nodes, items[i], connectionType, i, parentName);
            }
        }
    }
    else {
        addSingleSubnode(nodes, subnodeOrArray, connectionType, 0, parentName);
    }
}
function addSubnodeFlat(nodes, subnodeOrArray, connectionType, parentName) {
    if (!subnodeOrArray)
        return;
    const items = Array.isArray(subnodeOrArray) ? subnodeOrArray : [subnodeOrArray];
    for (const sub of items) {
        addSingleSubnode(nodes, sub, connectionType, 0, parentName);
    }
}
function processSubnodes(nodes, parentName, subnodes) {
    addSubnodeOrArray(nodes, subnodes.model, 'ai_languageModel', parentName);
    if (subnodes.memory)
        addSingleSubnode(nodes, subnodes.memory, 'ai_memory', 0, parentName);
    if (subnodes.tools) {
        for (const tool of subnodes.tools) {
            addSingleSubnode(nodes, tool, 'ai_tool', 0, parentName);
        }
    }
    if (subnodes.outputParser)
        addSingleSubnode(nodes, subnodes.outputParser, 'ai_outputParser', 0, parentName);
    addSubnodeFlat(nodes, subnodes.embedding ?? subnodes.embeddings, 'ai_embedding', parentName);
    if (subnodes.vectorStore)
        addSingleSubnode(nodes, subnodes.vectorStore, 'ai_vectorStore', 0, parentName);
    if (subnodes.retriever)
        addSingleSubnode(nodes, subnodes.retriever, 'ai_retriever', 0, parentName);
    addSubnodeFlat(nodes, subnodes.documentLoader, 'ai_document', parentName);
    if (subnodes.textSplitter)
        addSingleSubnode(nodes, subnodes.textSplitter, 'ai_textSplitter', 0, parentName);
    addSubnodeFlat(nodes, subnodes.reranker, 'ai_reranker', parentName);
}
function addNodeWithSubnodes(nodes, nodeInstance) {
    if (!nodeInstance || typeof nodeInstance !== 'object') {
        return undefined;
    }
    if (!nodeInstance.type || !nodeInstance.name) {
        return undefined;
    }
    for (const [key, graphNode] of nodes) {
        if (graphNode.instance === nodeInstance) {
            return key;
        }
    }
    let mapKey = nodeInstance.name;
    const existingNode = nodes.get(nodeInstance.name);
    if (existingNode) {
        if (existingNode.instance === nodeInstance) {
            return undefined;
        }
        mapKey = generateUniqueName(nodes, nodeInstance.name);
    }
    const connectionsMap = new Map();
    connectionsMap.set('main', new Map());
    nodes.set(mapKey, {
        instance: nodeInstance,
        connections: connectionsMap,
    });
    const subnodes = nodeInstance.config?.subnodes;
    if (!subnodes)
        return mapKey;
    processSubnodes(nodes, mapKey, subnodes);
    return mapKey;
}
//# sourceMappingURL=subnode-utils.js.map