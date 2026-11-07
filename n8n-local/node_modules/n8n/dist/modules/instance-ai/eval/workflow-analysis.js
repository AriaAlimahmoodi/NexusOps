"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TRIGGER_CONTENT_CORRECTION = exports.isAiRootNodeType = void 0;
exports.isVendorSdkSubNode = isVendorSdkSubNode;
exports.isDataTableRead = isDataTableRead;
exports.emitsDataTableRows = emitsDataTableRows;
exports.identifyNodesForPinData = identifyNodesForPinData;
exports.detectBinaryDependencies = detectBinaryDependencies;
exports.buildVendorLlmRouting = buildVendorLlmRouting;
exports.partitionAiRoots = partitionAiRoots;
exports.identifyNodesForHints = identifyNodesForHints;
exports.generateMockHints = generateMockHints;
const llm_output_1 = require("@n8n/ai-utilities/llm-output");
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const instance_ai_1 = require("@n8n/instance-ai");
const is_record_1 = require("@n8n/utils/is-record");
const workflow_sdk_1 = require("@n8n/workflow-sdk");
Object.defineProperty(exports, "isAiRootNodeType", { enumerable: true, get: function () { return workflow_sdk_1.isAiRootNodeType; } });
const n8n_workflow_1 = require("n8n-workflow");
const date_anchors_1 = require("./date-anchors");
const node_config_1 = require("./node-config");
function findAiSubNodeNames(workflow) {
    const subNodes = new Set();
    for (const [sourceName, nodeConns] of Object.entries(workflow.connections)) {
        for (const connType of Object.keys(nodeConns)) {
            if (connType.startsWith('ai_')) {
                subNodes.add(sourceName);
            }
        }
    }
    return subNodes;
}
const BYPASS_NODE_TYPES = new Set([
    'n8n-nodes-base.redis',
    'n8n-nodes-base.mongoDb',
    'n8n-nodes-base.mySql',
    'n8n-nodes-base.postgres',
    'n8n-nodes-base.microsoftSql',
    'n8n-nodes-base.snowflake',
    'n8n-nodes-base.kafka',
    'n8n-nodes-base.rabbitmq',
    'n8n-nodes-base.mqtt',
    'n8n-nodes-base.amqp',
    'n8n-nodes-base.ftp',
    'n8n-nodes-base.ssh',
    'n8n-nodes-base.ldap',
    'n8n-nodes-base.emailSend',
    'n8n-nodes-base.rssFeedRead',
    'n8n-nodes-base.git',
]);
const SUPPORTED_VENDOR_LLM_SUB_NODE_TYPES = new Set(['@n8n/n8n-nodes-langchain.lmChatOpenAi']);
function isVendorLlmSubNode(nodeType) {
    return nodeType.startsWith('@n8n/n8n-nodes-langchain.lm');
}
function isVendorEmbeddingsSubNode(nodeType) {
    return nodeType.startsWith('@n8n/n8n-nodes-langchain.embeddings');
}
function isVendorSdkSubNode(nodeType) {
    if (!nodeType)
        return false;
    return isVendorLlmSubNode(nodeType) || isVendorEmbeddingsSubNode(nodeType);
}
function isMcpRegistryNode(nodeType) {
    return nodeType.startsWith('@n8n/mcp-registry.');
}
function hasUnsafeBaseUrlOverride(node) {
    if (node.type === '@n8n/n8n-nodes-langchain.lmChatOpenAi') {
        const options = (node.parameters?.options ?? {});
        const baseURL = options.baseURL;
        return typeof baseURL === 'string' && baseURL.trim().length > 0;
    }
    return false;
}
const PROTOCOL_BINARY_SUB_NODE_TYPES = new Set([
    '@n8n/n8n-nodes-langchain.memoryPostgresChat',
    '@n8n/n8n-nodes-langchain.memoryRedisChat',
    '@n8n/n8n-nodes-langchain.memoryMongoDbChat',
    '@n8n/n8n-nodes-langchain.vectorStorePGVector',
    '@n8n/n8n-nodes-langchain.vectorStoreMongoDBAtlas',
    '@n8n/n8n-nodes-langchain.vectorStoreRedis',
    '@n8n/n8n-nodes-langchain.vectorStoreMilvus',
    '@n8n/n8n-nodes-langchain.chatHubVectorStorePGVector',
]);
const DATA_TABLE_READ_OPERATIONS = new Set(['get', 'rowExists', 'rowNotExists']);
const DATA_TABLE_ROW_EMITTING_OPERATIONS = new Set(['get']);
function isDataTableRead(node) {
    if (node.type !== 'n8n-nodes-base.dataTable')
        return false;
    const params = node.parameters;
    return ((params?.resource ?? 'row') === 'row' &&
        DATA_TABLE_READ_OPERATIONS.has(params?.operation ?? 'insert'));
}
function emitsDataTableRows(node) {
    if (!isDataTableRead(node))
        return false;
    const params = node.parameters;
    return DATA_TABLE_ROW_EMITTING_OPERATIONS.has(params?.operation ?? 'insert');
}
function identifyNodesForPinData(workflow, exclusionSet, liveReads) {
    const aiRootNodes = (0, n8n_workflow_1.findAiRootNodeNames)(workflow.connections);
    return workflow.nodes.filter((node) => {
        if (node.disabled)
            return false;
        if (aiRootNodes.has(node.name) && !exclusionSet?.has(node.name))
            return true;
        if (BYPASS_NODE_TYPES.has(node.type))
            return true;
        if (isDataTableRead(node))
            return !liveReads?.has(node.name);
        return false;
    });
}
const BINARY_CONSUMER_NODE_TYPES = {
    'n8n-nodes-base.extractFromFile': { contentType: 'application/pdf', filename: 'input.pdf' },
    'n8n-nodes-base.readBinaryFile': {
        contentType: 'application/octet-stream',
        filename: 'input.bin',
    },
    'n8n-nodes-base.writeBinaryFile': {
        contentType: 'application/octet-stream',
        filename: 'input.bin',
    },
    '@n8n/n8n-nodes-langchain.documentBinaryInputLoader': {
        contentType: 'application/pdf',
        filename: 'input.pdf',
    },
};
const PREFERRED_BINARY_DEFAULTS = {
    'n8n-nodes-base.telegram': { contentType: 'audio/ogg', filename: 'voice.ogg' },
};
const BINARY_EXPRESSION_RE = /\$binary\.([A-Za-z_][\w-]*)/;
const BINARY_PROPERTY_PARAM_NAMES = new Set([
    'binaryPropertyName',
    'binaryProperty',
    'dataPropertyName',
    'dataPropertyNameUpload',
    'binaryDataKey',
    'inputDataFieldName',
]);
function extractLiteralFromExpression(value) {
    const trimmed = value.slice(1).trim();
    if (!trimmed.startsWith('{{') || !trimmed.endsWith('}}'))
        return undefined;
    const inner = trimmed.slice(2, -2).trim();
    const m = /^(["'])(.+)\1$/.exec(inner);
    return m ? m[2] : undefined;
}
function findBinaryPropertyNameParam(params) {
    if (!params || typeof params !== 'object')
        return undefined;
    for (const [key, value] of Object.entries(params)) {
        if (BINARY_PROPERTY_PARAM_NAMES.has(key) && typeof value === 'string' && value.length > 0) {
            if (!value.startsWith('='))
                return { propertyName: value };
            const literal = extractLiteralFromExpression(value);
            return { propertyName: literal ?? 'data' };
        }
        if (typeof value === 'object' && value !== null) {
            const nested = findBinaryPropertyNameParam(value);
            if (nested)
                return nested;
        }
    }
    return undefined;
}
function detectBinaryDependencies(workflow) {
    let match;
    for (const node of workflow.nodes) {
        if (node.disabled)
            continue;
        const serialized = JSON.stringify(node.parameters ?? {});
        const exprMatch = BINARY_EXPRESSION_RE.exec(serialized);
        if (exprMatch && !match) {
            match = { propertyName: exprMatch[1], nodeType: node.type };
            continue;
        }
        const paramMatch = findBinaryPropertyNameParam(node.parameters);
        if (paramMatch && !match) {
            match = { propertyName: paramMatch.propertyName, nodeType: node.type };
        }
    }
    if (match) {
        const defaults = BINARY_CONSUMER_NODE_TYPES[match.nodeType] ??
            PREFERRED_BINARY_DEFAULTS[match.nodeType] ?? {
            contentType: 'application/octet-stream',
            filename: 'input.bin',
        };
        return { propertyName: match.propertyName, ...defaults };
    }
    for (const node of workflow.nodes) {
        if (node.disabled)
            continue;
        const defaults = BINARY_CONSUMER_NODE_TYPES[node.type];
        if (defaults) {
            return { propertyName: 'data', ...defaults };
        }
    }
    return undefined;
}
function buildVendorLlmRouting(workflow, unpinNodes) {
    const subNodeToRoot = new Map();
    const rootToSubNode = new Map();
    if (unpinNodes.length === 0)
        return { subNodeToRoot, rootToSubNode };
    const nodesByName = new Map(workflow.nodes.map((n) => [n.name, n]));
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(workflow.connections);
    for (const rootName of unpinNodes) {
        const inbound = connectionsByDestination[rootName];
        if (!inbound)
            continue;
        for (const [connType, groups] of Object.entries(inbound)) {
            if (connType !== 'ai_languageModel' || !Array.isArray(groups))
                continue;
            for (const group of groups) {
                if (!Array.isArray(group))
                    continue;
                for (const conn of group) {
                    const subNode = nodesByName.get(conn.node);
                    if (!subNode || subNode.disabled)
                        continue;
                    if (!SUPPORTED_VENDOR_LLM_SUB_NODE_TYPES.has(subNode.type))
                        continue;
                    if (!subNodeToRoot.has(subNode.name)) {
                        subNodeToRoot.set(subNode.name, rootName);
                    }
                    if (!rootToSubNode.has(rootName)) {
                        rootToSubNode.set(rootName, subNode);
                        subNodeToRoot.set(rootName, rootName);
                    }
                }
            }
        }
    }
    return { subNodeToRoot, rootToSubNode };
}
function partitionAiRoots(workflow, explicitPinNodes = []) {
    const nodesByName = new Map(workflow.nodes.map((n) => [n.name, n]));
    const connectionsByDestination = (0, n8n_workflow_1.mapConnectionsByDestination)(workflow.connections);
    const allRoots = (0, n8n_workflow_1.findAiRootNodeNames)(workflow.connections);
    validateExplicitPinNodes(nodesByName, allRoots, explicitPinNodes);
    const explicitPinSet = new Set(explicitPinNodes);
    const sharedSupportedSubNodes = trackSharedSupportedSubNodes(connectionsByDestination, nodesByName, allRoots, explicitPinSet);
    const autoPinned = [];
    const pinSet = new Set(explicitPinNodes);
    for (const rootName of allRoots) {
        if (explicitPinSet.has(rootName))
            continue;
        const inbound = connectionsByDestination[rootName];
        if (!inbound)
            continue;
        for (const [connType, groups] of Object.entries(inbound)) {
            if (!connType.startsWith('ai_') || !Array.isArray(groups))
                continue;
            for (const group of groups) {
                if (!Array.isArray(group))
                    continue;
                for (const conn of group) {
                    const sourceNode = nodesByName.get(conn.node);
                    if (!sourceNode || sourceNode.disabled)
                        continue;
                    const reason = categorizeSubNodeIncompatibility(sourceNode, sharedSupportedSubNodes);
                    if (reason === null)
                        continue;
                    autoPinned.push({
                        root: rootName,
                        subNode: sourceNode.name,
                        subNodeType: sourceNode.type,
                        reason,
                    });
                    pinSet.add(rootName);
                }
            }
        }
    }
    const unpinNodes = [];
    const pinNodes = [];
    for (const rootName of allRoots) {
        if (pinSet.has(rootName))
            pinNodes.push(rootName);
        else
            unpinNodes.push(rootName);
    }
    return { unpinNodes, pinNodes, autoPinned };
}
function validateExplicitPinNodes(nodesByName, aiRootNodes, explicitPinNodes) {
    const unknownRoots = [];
    const disabledRoots = [];
    const nonAiRoots = [];
    for (const rootName of explicitPinNodes) {
        const node = nodesByName.get(rootName);
        if (!node)
            unknownRoots.push(rootName);
        else if (node.disabled)
            disabledRoots.push(rootName);
        else if (!aiRootNodes.has(rootName) && !(0, workflow_sdk_1.isAiRootNodeType)(node.type)) {
            nonAiRoots.push(rootName);
        }
    }
    if (unknownRoots.length || disabledRoots.length || nonAiRoots.length) {
        const formatNames = (names) => names.map((n) => `"${n}"`).join(', ');
        const parts = [];
        if (unknownRoots.length)
            parts.push(`not found in workflow: ${formatNames(unknownRoots)}`);
        if (disabledRoots.length)
            parts.push(`disabled: ${formatNames(disabledRoots)}`);
        if (nonAiRoots.length)
            parts.push(`not AI root nodes: ${formatNames(nonAiRoots)}`);
        throw new n8n_workflow_1.UserError(`Cannot pin — ${parts.join('; ')}.`);
    }
}
function trackSharedSupportedSubNodes(connectionsByDestination, nodesByName, allRoots, explicitPinSet) {
    const usage = new Map();
    for (const rootName of allRoots) {
        if (explicitPinSet.has(rootName))
            continue;
        const inbound = connectionsByDestination[rootName];
        if (!inbound)
            continue;
        for (const [connType, groups] of Object.entries(inbound)) {
            if (!connType.startsWith('ai_') || !Array.isArray(groups))
                continue;
            for (const group of groups) {
                if (!Array.isArray(group))
                    continue;
                for (const conn of group) {
                    const sourceNode = nodesByName.get(conn.node);
                    if (!sourceNode || sourceNode.disabled)
                        continue;
                    if (!SUPPORTED_VENDOR_LLM_SUB_NODE_TYPES.has(sourceNode.type))
                        continue;
                    const tracked = usage.get(sourceNode.name) ?? new Set();
                    tracked.add(rootName);
                    usage.set(sourceNode.name, tracked);
                }
            }
        }
    }
    const shared = new Set();
    for (const [subNodeName, roots] of usage) {
        if (roots.size >= 2)
            shared.add(subNodeName);
    }
    return shared;
}
function categorizeSubNodeIncompatibility(sourceNode, sharedSupportedSubNodes) {
    if (PROTOCOL_BINARY_SUB_NODE_TYPES.has(sourceNode.type))
        return 'protocol_binary';
    if (isMcpRegistryNode(sourceNode.type))
        return 'protocol_binary';
    if (SUPPORTED_VENDOR_LLM_SUB_NODE_TYPES.has(sourceNode.type)) {
        if (sharedSupportedSubNodes.has(sourceNode.name))
            return 'shared_vendor_llm_subnode';
        return hasUnsafeBaseUrlOverride(sourceNode) ? 'unsafe_baseurl_override' : null;
    }
    if (isVendorLlmSubNode(sourceNode.type))
        return 'unsupported_vendor_llm';
    if (isVendorEmbeddingsSubNode(sourceNode.type))
        return 'unsupported_vendor_embeddings';
    return null;
}
function identifyNodesForHints(workflow) {
    const aiSubNodes = findAiSubNodeNames(workflow);
    const aiRootNodes = (0, n8n_workflow_1.findAiRootNodeNames)(workflow.connections);
    const pinnedNodeNames = new Set(identifyNodesForPinData(workflow).map((n) => n.name));
    return workflow.nodes.filter((node) => {
        if (node.disabled)
            return false;
        if (aiSubNodes.has(node.name))
            return false;
        if (aiRootNodes.has(node.name))
            return false;
        if (pinnedNodeNames.has(node.name))
            return false;
        return true;
    });
}
exports.TRIGGER_CONTENT_CORRECTION = 'The previous answer left "triggerContent" empty. The Test Scenario describes the event that fires the workflow\'s trigger or start node, so "triggerContent" must carry that event as the node\'s output object and must not be {}. Set "triggerEmitsNoItems": true only when the scenario says the trigger has nothing to emit.';
const SYSTEM_PROMPT = `You are a test data planner for n8n workflow automation. Your job is to create a consistent data context, trigger output data, and per-node hints that will guide an API mock server to generate realistic, coherent responses across all nodes in a workflow.

RULES:
1. Create a "globalContext" that defines the shared world — user IDs, entity names, channel names, email addresses, and relationships that ALL nodes should reference consistently. State it as plain facts. Never describe a response layout, JSON, field paths, or what an n8n node outputs.
2. Create a "triggerContent" object that represents the exact output the workflow's trigger/start node would produce. This is used as pin data (the node's output), so it must match what downstream nodes reference:
   - Look at the trigger node's type to determine the output structure
   - For webhook triggers: include { headers: {}, query: {}, body: { ...fields } } since downstream nodes reference $json.body.fieldName
   - For service-specific triggers (Gmail Trigger, Slack Trigger, etc.): match the service's real event/message output format
   - For schedule triggers: include timestamp fields
   - For a Manual Trigger: it emits one empty item, so return {} and never invent fields for it, even when downstream nodes reference trigger fields
   - CRITICAL: apart from a Manual Trigger, triggerContent must NEVER be an empty object ({}). Even for scenarios that test empty payloads ("empty submission", "no data", "missing fields"), emit the trigger envelope with empty *nested* fields — an empty webhook is { headers: {}, query: {}, body: {} }, a schedule with no context is { timestamp: "..." }. The workflow cannot execute without trigger output. The one exception is a polling or event trigger that the scenario says has NOTHING to emit ("no new emails", "no new rows", "no results"): then set "triggerEmitsNoItems": true and omit triggerContent — the harness pins the trigger to zero items so downstream nodes do not run.
   - CRITICAL: check what downstream nodes reference (e.g., $json.body.email, $json.subject, $json.text) and ensure those paths exist in triggerContent
   - CRITICAL: when the workflow has MULTIPLE trigger nodes, pick the ONE the Test Scenario targets (the trigger whose firing the scenario describes, e.g. "The weekly Schedule Trigger fires") and return its exact node name in a "startNodeName" field. triggerContent must be THAT trigger's output.
   - CRITICAL: triggerContent must NEVER contain binary file CONTENT — no base64 blobs, no fake file-bytes placeholders. When the trigger carries a file (form upload, email attachment, incoming media), declare it with a METADATA-ONLY binary map instead: "binary": { "<propertyKey>": { "mimeType": "<real MIME>", "fileName": "<name.ext>" } } — the harness synthesizes real file bytes from that metadata and attaches them at the item level. For a PDF or text file whose words the scenario states, also add "text": "<those words as plain text>" to its entry — the harness writes them into the file. The MIME type and file name MUST match the scenario: an image/png upload scenario needs mimeType "image/png" and a .png fileName, never a generic application/octet-stream. Use "data" as the propertyKey unless downstream nodes reference a different binary property name.
3. Create a "nodeHints" object with one entry per node that calls an external service. Each hint states the DATA the service holds for that node: the records, field values, counts, IDs, dates and statuses, using entities from the global context. One node can send several requests (for example it reads a sheet's metadata and rows, then appends a row). Write each hint in two parts: "Before the node runs:" with what the service already holds, then "The node writes:" with what the node adds, changes or sends (or "nothing"). A read that happens before the write sees only the "Before the node runs" data.
4. A hint states data, never a response layout. Do not write JSON, braces, field paths, wrapper keys, status envelopes or "return {...}". Do not describe what the n8n node outputs after its own processing (simplified records, rows keyed by column header, parsed JSON, fields such as json.data or output[0].content[0].text). The mock server writes each response in the real API's wire format and only needs the facts. Write facts as plain sentences, e.g. "Sheet 'Leads' has columns Name, Email, Status and 2 rows: Ann Lee, ann@x.example, new; Bo Chan, bo@x.example, won."
5. Ensure data flows logically through the workflow. If node A fetches items that node B processes, A's hint lists the items B needs. Expressions such as $json.field read the node's OUTPUT, not the API response: use them to know which facts matter, not how to lay them out.
6. Use realistic but clearly fake values (e.g., "jane@example.com", "U_abc123").
7. **If a "Test Scenario" section is provided, it OVERRIDES your default data generation.** Use the exact names, emails, numeric magnitudes (amounts, percentages, counts, thresholds), and conditions described in the scenario. If the scenario says "no name field", do NOT include a name. If it says "email is not-an-email", use that exact value. The scenario defines the test — follow it precisely.
8. **Allocate scenario error conditions explicitly.** When the Test Scenario describes an error, failure, or missing-data condition for a SPECIFIC subset of the workflow's requests (one channel out of three, one user, one record), the affected node's hint MUST make it unambiguous: name the exact entity and identifier (channel name/ID, user ID), name the request that fails and the error as the API reports it (the HTTP status and the API's own error code or message, e.g. Slack conversations.history for #product fails with error channel_not_found), without writing the error body, and state that requests for all OTHER entities succeed normally. The mock server handles one request at a time and can only distinguish requests by their parameters — an error condition left implicit ("one channel fails") never gets simulated, and the scenario cannot be evaluated.
9. **Dates and timestamps.** The user prompt ends with a "## Date anchors" block listing today's real date plus relative anchors. EVERY date or timestamp you emit — in globalContext, triggerContent, and nodeHints — MUST be derived from those anchors, never from training data. Workflows compare mock data against the real execution clock ($now, Date.now()): a "recent" record dated months ago gets silently filtered out and the test fails. When the scenario describes a relative window ("issues from the last 2 weeks", "yesterday's orders"), compute concrete dates from the anchors and place records safely INSIDE the window (e.g. 2-5 days ago), never on its boundary. State those concrete dates in globalContext and nodeHints so every node's mock uses the same ones.
10. Return ONLY valid JSON, no explanation or markdown fencing.`;
function buildUserPrompt(workflow, nodeNames, scenarioHints) {
    const sections = [
        'Generate a consistent data context and per-node mock hints for this workflow.',
    ];
    if (scenarioHints) {
        sections.push('', '## Test Scenario', '', scenarioHints);
    }
    sections.push('', '## Workflow Nodes', '');
    for (const node of workflow.nodes) {
        let line = `- ${node.name} (${node.type})`;
        const config = (0, node_config_1.extractNodeConfig)(node);
        if (config) {
            line += ` ${config}`;
        }
        sections.push(line);
    }
    sections.push('', '## Connections', '');
    for (const [sourceName, nodeConns] of Object.entries(workflow.connections)) {
        for (const [connType, outputs] of Object.entries(nodeConns)) {
            if (!Array.isArray(outputs))
                continue;
            for (const group of outputs) {
                if (!Array.isArray(group))
                    continue;
                for (const conn of group) {
                    if (typeof conn === 'object' && conn !== null && 'node' in conn) {
                        sections.push(`  ${sourceName} -[${connType}]-> ${conn.node}`);
                    }
                }
            }
        }
    }
    sections.push('', '## Expected Output', '', '```json', '{');
    sections.push('  "globalContext": "Shared entities: ...",');
    sections.push('  "startNodeName": "exact trigger node name the scenario targets (only when the workflow has multiple triggers)",');
    sections.push('  "triggerContent": { "...exact output the trigger node would produce..." },');
    sections.push('  "triggerEmitsNoItems": "true only when the scenario says the trigger emits nothing; then omit triggerContent",');
    sections.push('  "nodeHints": {');
    for (let i = 0; i < Math.min(nodeNames.length, 3); i++) {
        const comma = i < Math.min(nodeNames.length, 3) - 1 ? ',' : '';
        sections.push(`    "${nodeNames[i]}": "Data this node's service holds and what the node writes..."${comma}`);
    }
    if (nodeNames.length > 3)
        sections.push('    ...');
    sections.push('  }', '}', '```');
    sections.push('', '## Date anchors', (0, date_anchors_1.buildDateAnchors)(new Date()));
    return sections.join('\n');
}
const MAX_HINT_ATTEMPTS = 2;
const HINT_LLM_TIMEOUT_MS = 300_000;
function isManualTriggerNode(workflow, nodeName) {
    const node = workflow.nodes.find((n) => n.name === nodeName);
    return node?.type === n8n_workflow_1.MANUAL_TRIGGER_NODE_TYPE && !node.disabled;
}
function unwrapItemShape(content) {
    if (!(0, is_record_1.isRecord)(content))
        return content;
    const { json, ...rest } = content;
    if (!(0, is_record_1.isRecord)(json) || Object.keys(rest).some((key) => key !== 'binary'))
        return content;
    return rest.binary === undefined ? json : { ...json, binary: rest.binary };
}
async function generateMockHints(options) {
    const { workflow, nodeNames, scenarioHints } = options;
    const emptyResult = {
        globalContext: '',
        nodeHints: {},
        triggerContent: {},
        warnings: [],
        bypassPinData: {},
    };
    if (nodeNames.length === 0)
        return emptyResult;
    const basePrompt = buildUserPrompt(workflow, nodeNames, scenarioHints);
    const warnings = [];
    let lastReason = '';
    for (let attempt = 1; attempt <= MAX_HINT_ATTEMPTS; attempt++) {
        let reason = '';
        const userPrompt = lastReason
            ? `${basePrompt}\n\n## Correction required\n\n${correctionFor(lastReason)}`
            : basePrompt;
        try {
            const agent = (0, instance_ai_1.createEvalAgent)('eval-hint-generator', {
                instructions: SYSTEM_PROMPT,
            });
            const result = await agent.generate(userPrompt, {
                providerOptions: { anthropic: { maxTokens: 16_384 } },
                abortSignal: AbortSignal.timeout(HINT_LLM_TIMEOUT_MS),
            });
            const text = (0, llm_output_1.extractJsonCandidate)((0, instance_ai_1.extractText)(result));
            const parsed = (0, n8n_workflow_1.jsonParse)(text);
            let globalContext = '';
            if (typeof parsed.globalContext === 'string') {
                globalContext = parsed.globalContext;
            }
            else if (typeof parsed.globalContext === 'object' && parsed.globalContext !== null) {
                globalContext = JSON.stringify(parsed.globalContext);
            }
            if (typeof parsed.nodeHints !== 'object' ||
                parsed.nodeHints === null ||
                Array.isArray(parsed.nodeHints)) {
                reason = `invalid nodeHints structure (raw: ${text.slice(0, 200)})`;
            }
            else {
                const triggerContent = unwrapItemShape(typeof parsed.triggerContent === 'object' &&
                    parsed.triggerContent !== null &&
                    !Array.isArray(parsed.triggerContent)
                    ? parsed.triggerContent
                    : {});
                const triggerEmitsNoItems = parsed.triggerEmitsNoItems === true || parsed.triggerEmitsNoItems === 'true';
                const startNodeName = typeof parsed.startNodeName === 'string' && parsed.startNodeName.length > 0
                    ? parsed.startNodeName
                    : undefined;
                if (Object.keys(triggerContent).length === 0 &&
                    !triggerEmitsNoItems &&
                    !isManualTriggerNode(workflow, startNodeName ?? options.defaultStartNodeName)) {
                    reason = 'empty triggerContent';
                }
                else {
                    const nodeHints = {};
                    for (const [key, value] of Object.entries(parsed.nodeHints)) {
                        nodeHints[key] = typeof value === 'string' ? value : JSON.stringify(value);
                    }
                    return {
                        globalContext,
                        nodeHints,
                        triggerContent: triggerContent,
                        ...(startNodeName ? { startNodeName } : {}),
                        ...(triggerEmitsNoItems ? { triggerEmitsNoItems: true } : {}),
                        warnings,
                        bypassPinData: {},
                    };
                }
            }
        }
        catch (error) {
            reason = error instanceof Error ? error.message : String(error);
        }
        warnings.push(`Phase 1 attempt ${attempt}/${MAX_HINT_ATTEMPTS}: ${reason}`);
        lastReason = reason;
        if (attempt < MAX_HINT_ATTEMPTS) {
            di_1.Container.get(backend_common_1.Logger).warn(`[EvalMock] Phase 1 attempt ${attempt}/${MAX_HINT_ATTEMPTS} unusable (${reason}) — retrying`);
        }
    }
    di_1.Container.get(backend_common_1.Logger).error(`[EvalMock] Phase 1 exhausted ${MAX_HINT_ATTEMPTS} attempts — ${warnings.join('; ')}`);
    return { ...emptyResult, warnings };
}
function correctionFor(reason) {
    if (reason === 'empty triggerContent')
        return exports.TRIGGER_CONTENT_CORRECTION;
    return `The previous answer was unusable: ${reason}. Return only the JSON object described under "Expected Output".`;
}
//# sourceMappingURL=workflow-analysis.js.map