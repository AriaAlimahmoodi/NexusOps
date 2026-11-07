"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesPattern = matchesPattern;
exports.getMatchingGuides = getMatchingGuides;
exports.getMatchingExamples = getMatchingExamples;
const examples_1 = require("./examples");
const guides_1 = require("./guides");
const guides = [
    guides_1.SET_NODE_GUIDE,
    guides_1.IF_NODE_GUIDE,
    guides_1.SWITCH_NODE_GUIDE,
    guides_1.HTTP_REQUEST_GUIDE,
    guides_1.TOOL_NODES_GUIDE,
    guides_1.GMAIL_GUIDE,
    guides_1.EMBEDDING_NODES_GUIDE,
    guides_1.RESOURCE_LOCATOR_GUIDE,
    guides_1.SYSTEM_MESSAGE_GUIDE,
    guides_1.TEXT_FIELDS_GUIDE,
    guides_1.PREDECESSOR_OUTPUT_GUIDE,
];
const examples = [
    examples_1.SET_NODE_EXAMPLES,
    examples_1.IF_NODE_EXAMPLES,
    examples_1.SWITCH_NODE_EXAMPLES,
    examples_1.SIMPLE_UPDATE_EXAMPLES,
    examples_1.TOOL_NODE_EXAMPLES,
    examples_1.RESOURCE_LOCATOR_EXAMPLES,
];
function matchesPattern(nodeType, pattern) {
    const nodeTypeLower = nodeType.toLowerCase();
    const patternLower = pattern.toLowerCase();
    if (nodeTypeLower === patternLower) {
        return true;
    }
    if (patternLower.startsWith('*')) {
        const suffix = patternLower.slice(1);
        return nodeTypeLower.endsWith(suffix);
    }
    if (patternLower.endsWith('*')) {
        const prefix = patternLower.slice(0, -1);
        return nodeTypeLower.startsWith(prefix);
    }
    return nodeTypeLower.includes(patternLower);
}
function getMatchingGuides(context) {
    return guides.filter((guide) => {
        const patternMatches = guide.patterns.some((pattern) => matchesPattern(context.nodeType, pattern));
        if (!patternMatches)
            return false;
        if (guide.condition && !guide.condition(context)) {
            return false;
        }
        return true;
    });
}
function getMatchingExamples(context) {
    return examples.filter((example) => {
        const patternMatches = example.patterns.some((pattern) => matchesPattern(context.nodeType, pattern));
        if (!patternMatches)
            return false;
        if (example.condition && !example.condition(context)) {
            return false;
        }
        return true;
    });
}
//# sourceMappingURL=registry.js.map