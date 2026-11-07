"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOutputName = getOutputName;
exports.getInputName = getInputName;
exports.getCompositeType = getCompositeType;
exports.getNodeSemantics = getNodeSemantics;
exports.isCycleOutput = isCycleOutput;
const NODE_SEMANTICS = {
    'n8n-nodes-base.if': {
        outputs: ['trueBranch', 'falseBranch'],
        inputs: ['input'],
        composite: 'ifElse',
    },
    'n8n-nodes-base.switch': {
        outputs: (node) => {
            const params = node.parameters;
            const rules = params?.rules;
            const rulesArray = (rules?.rules ?? rules?.values);
            const numCases = rulesArray?.length ?? 4;
            const cases = Array.from({ length: numCases }, (_, i) => `case${i}`);
            return [...cases, 'fallback'];
        },
        inputs: ['input'],
        composite: 'switchCase',
    },
    'n8n-nodes-base.merge': {
        outputs: ['output'],
        inputs: (node) => {
            const params = node.parameters;
            const numInputs = params?.numberInputs ?? 2;
            return Array.from({ length: numInputs }, (_, i) => `branch${i}`);
        },
        composite: 'merge',
    },
    'n8n-nodes-base.splitInBatches': {
        outputs: ['done', 'loop'],
        inputs: ['input'],
        cycleOutput: 'loop',
        composite: 'splitInBatches',
    },
};
function hasErrorOutput(node) {
    return node.onError === 'continueErrorOutput';
}
function getErrorOutputIndex(type, node) {
    const semantics = NODE_SEMANTICS[type];
    if (semantics) {
        const outputs = typeof semantics.outputs === 'function' ? semantics.outputs(node) : semantics.outputs;
        return outputs.length;
    }
    return 1;
}
function getOutputName(type, index, node) {
    if (hasErrorOutput(node)) {
        const errorIndex = getErrorOutputIndex(type, node);
        if (index === errorIndex) {
            return 'error';
        }
    }
    const semantics = NODE_SEMANTICS[type];
    if (!semantics) {
        return `output${index}`;
    }
    const outputs = typeof semantics.outputs === 'function' ? semantics.outputs(node) : semantics.outputs;
    if (index < outputs.length) {
        return outputs[index];
    }
    return `output${index}`;
}
function getInputName(type, index, node) {
    const semantics = NODE_SEMANTICS[type];
    if (!semantics) {
        return `input${index}`;
    }
    const inputs = typeof semantics.inputs === 'function' ? semantics.inputs(node) : semantics.inputs;
    if (index < inputs.length) {
        return inputs[index];
    }
    return `input${index}`;
}
function getCompositeType(type) {
    return NODE_SEMANTICS[type]?.composite;
}
function getNodeSemantics(type, node) {
    const semantics = NODE_SEMANTICS[type];
    if (!semantics) {
        return undefined;
    }
    const outputs = typeof semantics.outputs === 'function' ? semantics.outputs(node) : semantics.outputs;
    const inputs = typeof semantics.inputs === 'function' ? semantics.inputs(node) : semantics.inputs;
    return {
        outputs,
        inputs,
        cycleOutput: semantics.cycleOutput,
        composite: semantics.composite,
    };
}
function isCycleOutput(type, outputName) {
    const semantics = NODE_SEMANTICS[type];
    return semantics?.cycleOutput === outputName;
}
//# sourceMappingURL=semantic-registry.js.map