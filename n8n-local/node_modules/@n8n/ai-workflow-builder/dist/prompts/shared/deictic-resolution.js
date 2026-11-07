"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildDeicticResolutionPrompt = buildDeicticResolutionPrompt;
function hasItems(arr) {
    return Boolean(arr && arr.length > 0);
}
function formatExamples(examples) {
    return examples.map((line) => `   - ${line}`);
}
function formatBulletList(examples) {
    return examples.map((example) => `- ${example}`);
}
function buildCoreTiers(examples) {
    return [
        'DEICTIC REFERENCE RESOLUTION (in priority order):',
        '',
        '1. CONVERSATION CONTEXT (highest priority):',
        '   If the conversation has established something that "this"/"these" could refer to',
        `   ${examples.conversationContext}`,
        '',
        '2. SELECTED NODES (when <selected_nodes> is present and non-empty):',
        '   - "this node" / "it" / "this" → The selected node(s)',
        ...formatExamples(examples.selectedNodes),
        '',
        '   SINGULAR vs PLURAL handling:',
        '   - If user uses singular ("this", "it") but multiple nodes are selected:',
        '     - If nodes are similar (same type), address them together',
        '     - If nodes are different types, briefly describe each or ask which one they mean',
        '   - If user uses plural ("these") with single selection, treat as referring to that node',
    ];
}
function buildPositionalReferencesSection(examples) {
    if (!hasItems(examples.positionalReferences))
        return [];
    return [
        '',
        '3. POSITIONAL REFERENCES (relative to selected nodes, using connection info):',
        '   Use <incoming_connections> and <outgoing_connections> from selected node context',
        '   - "previous" / "before" / "upstream" → nodes in incomingConnections',
        '   - "next" / "after" / "downstream" → nodes in outgoingConnections',
        '   - "first" / "start" → trigger/start nodes with no incoming connections',
        '   - "last" / "end" → terminal nodes with no outgoing connections',
        ...formatExamples(examples.positionalReferences),
    ];
}
function buildExplicitNameMentionsSection(examples) {
    if (!hasItems(examples.explicitNameMentions))
        return [];
    const tierNumber = hasItems(examples.positionalReferences) ? '4' : '3';
    return [
        '',
        `${tierNumber}. EXPLICIT NAME MENTIONS (when user mentions a node by name without @ selection):`,
        '   - "the [NodeName] node" → resolve by exact name match in workflow',
        '   - "the [NodeType]" (e.g., "the Webhook") → resolve by type match if unique',
        '   - If multiple nodes match, ask for clarification',
        ...formatExamples(examples.explicitNameMentions),
    ];
}
function buildAttributeBasedReferencesSection(examples) {
    if (!hasItems(examples.attributeBasedReferences))
        return [];
    const tierNumber = (hasItems(examples.positionalReferences) ? 1 : 0) +
        (hasItems(examples.explicitNameMentions) ? 1 : 0) +
        3;
    return [
        '',
        `${tierNumber}. ATTRIBUTE-BASED REFERENCES (when no explicit selection):`,
        '   - "the broken one" / "the red one" → nodes with non-empty <issues>',
        '   - "the unconfigured one" → nodes with missing required parameters',
        '   - "the new one" → most recently added node (if trackable)',
        ...formatExamples(examples.attributeBasedReferences),
    ];
}
function buildWorkflowFallbackSection(examples) {
    const fallbackTierNumber = (hasItems(examples.positionalReferences) ? 1 : 0) +
        (hasItems(examples.explicitNameMentions) ? 1 : 0) +
        (hasItems(examples.attributeBasedReferences) ? 1 : 0) +
        3;
    return [
        '',
        `${fallbackTierNumber}. WORKFLOW FALLBACK (when no nodes selected and no conversation context):`,
        '   - "this" → The workflow as a whole',
        '   - "these" / "these nodes" → All nodes in the workflow',
        ...formatExamples(examples.workflowFallback),
    ];
}
function buildDualReferencesSection(examples) {
    if (!hasItems(examples.dualReferences))
        return [];
    return [
        '',
        'DUAL REFERENCES (when user references two things):',
        '   - "connect this to that" → this = selected node, that = requires clarification or context',
        '   - "connect this to [NodeName]" → this = selected, NodeName = explicit mention',
        '   - "move this before that" → resolve both, ask if "that" is ambiguous',
        ...formatExamples(examples.dualReferences),
    ];
}
function buildDisambiguationAndNegation() {
    return [
        '',
        'DISAMBIGUATION:',
        '   - If 2+ nodes match a reference equally well, ask: "Which node do you mean: X or Y?"',
        '   - For destructive actions (delete, disconnect), always confirm the target',
        '   - If no match found, suggest similar names: "I don\'t see a node called X. Did you mean Y?"',
        '   - Never guess for ambiguous references - clarification is better than wrong actions',
        '',
        'NEGATION:',
        '   - "not this one" / "not X" → explicitly exclude X from consideration',
        '   - "the other one" → if 2 candidates, pick the one NOT selected/NOT recently mentioned',
    ];
}
function buildExampleSections(examples) {
    const lines = [];
    if (hasItems(examples.examples)) {
        lines.push('', 'Examples:', ...formatBulletList(examples.examples));
    }
    if (hasItems(examples.examplesWithSelection)) {
        lines.push('', 'Examples with selection:', ...formatBulletList(examples.examplesWithSelection));
    }
    if (hasItems(examples.examplesWithoutSelection)) {
        lines.push('', 'Examples without selection:', ...formatBulletList(examples.examplesWithoutSelection));
    }
    if (examples.additionalNotes) {
        lines.push('', examples.additionalNotes);
    }
    return lines;
}
function buildDeicticResolutionPrompt(examples) {
    const lines = [
        ...buildCoreTiers(examples),
        ...buildPositionalReferencesSection(examples),
        ...buildExplicitNameMentionsSection(examples),
        ...buildAttributeBasedReferencesSection(examples),
        ...buildWorkflowFallbackSection(examples),
        ...buildDualReferencesSection(examples),
        ...buildDisambiguationAndNegation(),
        ...buildExampleSections(examples),
    ];
    return lines.join('\n');
}
//# sourceMappingURL=deictic-resolution.js.map