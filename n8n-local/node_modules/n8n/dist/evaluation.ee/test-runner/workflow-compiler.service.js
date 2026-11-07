"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowCompilerService = void 0;
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const node_types_1 = require("../../node-types");
const evaluation_config_validator_1 = require("../evaluation-config-validator");
const llm_judge_provider_registry_1 = require("../llm-judge-provider-registry");
const RESERVED_PREFIX = '__eval_';
const TRIGGER_NAME = '__eval_trigger';
const NODE_STEP_X = 220;
const MODEL_OFFSET_Y = 220;
const METRIC_COLUMN_GAP = 440;
const EXPRESSION_ROW_HEIGHT = 140;
const LLM_JUDGE_ROW_HEIGHT = 380;
const DATASET_SOURCED_INPUTS = {
    expression: [],
    llm_judge: ['userQuery', 'expectedAnswer'],
    string_similarity: ['expectedAnswer'],
    categorization: ['expectedAnswer'],
    tools_used: ['expectedTools'],
};
let WorkflowCompilerService = class WorkflowCompilerService {
    constructor(providerRegistry, nodeTypes) {
        this.providerRegistry = providerRegistry;
        this.nodeTypes = nodeTypes;
    }
    compile(workflow, config) {
        this.assertNoReservedNames(workflow);
        const removedTriggerNames = new Set(workflow.nodes.filter((n) => n.type === n8n_workflow_1.EVALUATION_TRIGGER_NODE_TYPE).map((n) => n.name));
        const originalConnections = workflow.connections;
        workflow = this.prepareExistingEvaluationNodes(workflow, removedTriggerNames);
        const entryNodeName = this.resolveEntryNode(workflow, config);
        const userTriggerEdge = this.findUserTriggerEdgeTo(originalConnections, entryNodeName, removedTriggerNames);
        const replacedNodeName = this.findReplacedUpstreamNode(originalConnections, entryNodeName, removedTriggerNames);
        const rewriteTargets = new Set(removedTriggerNames);
        if (replacedNodeName)
            rewriteTargets.add(replacedNodeName);
        const entryPos = this.positionOf(workflow, entryNodeName) ?? [0, 0];
        const endPos = this.positionOf(workflow, config.endNodeName) ?? [
            entryPos[0] + NODE_STEP_X,
            entryPos[1],
        ];
        const rightmostX = workflow.nodes.reduce((max, n) => Math.max(max, n.position?.[0] ?? 0), endPos[0]);
        const metricColumnX = rightmostX + METRIC_COLUMN_GAP;
        const metricRowYs = this.computeMetricRowYs(config.metrics, endPos[1]);
        const triggerNode = this.buildEvaluationTriggerNode(config, entryPos);
        const metricNodes = config.metrics.map((m, i) => this.buildMetricNode(m, metricColumnX, metricRowYs[i]));
        const chatModelNodes = config.metrics.flatMap((m, i) => this.buildChatModelNodeIfNeeded(m, metricColumnX, metricRowYs[i]));
        const userNodesOut = rewriteTargets.size > 0
            ? workflow.nodes.map((n) => this.rewriteExpressionsOnNode(n, rewriteTargets))
            : workflow.nodes;
        const metricNodesOut = rewriteTargets.size > 0
            ? metricNodes.map((n) => this.rewriteExpressionsOnNode(n, rewriteTargets))
            : metricNodes;
        const nodes = [...userNodesOut, triggerNode, ...metricNodesOut, ...chatModelNodes];
        const connections = this.rewireConnections({
            original: workflow.connections,
            userTriggerEdge,
            entryNodeName,
            metrics: config.metrics,
            endNodeName: config.endNodeName,
        });
        return { ...workflow, nodes, connections };
    }
    findReplacedUpstreamNode(connections, entryNodeName, removedTriggerNames) {
        const upstreamNames = new Set();
        for (const [fromNode, conn] of Object.entries(connections)) {
            for (const bucket of conn.main ?? []) {
                for (const edge of bucket ?? []) {
                    if (edge?.node === entryNodeName)
                        upstreamNames.add(fromNode);
                }
            }
        }
        const keptCandidates = [...upstreamNames].filter((name) => !removedTriggerNames.has(name));
        if (keptCandidates.length === 1)
            return keptCandidates[0];
        if (keptCandidates.length === 0 && upstreamNames.size === 1)
            return [...upstreamNames][0];
        return null;
    }
    computeMetricRowYs(metrics, baseY) {
        const ys = [];
        let y = baseY;
        for (const m of metrics) {
            ys.push(y);
            y += m.type === 'llm_judge' ? LLM_JUDGE_ROW_HEIGHT : EXPRESSION_ROW_HEIGHT;
        }
        return ys;
    }
    rewriteExpressionsOnNode(node, fromNames) {
        let parameters = node.parameters;
        for (const fromName of fromNames) {
            parameters = rewriteExpressionRefs(parameters, fromName, node.type);
        }
        return { ...node, parameters };
    }
    prepareExistingEvaluationNodes(workflow, removedTriggerNames) {
        const nodes = workflow.nodes
            .filter((n) => !removedTriggerNames.has(n.name))
            .map((n) => n.type === n8n_workflow_1.EVALUATION_NODE_TYPE && n.parameters?.operation !== 'checkIfEvaluating'
            ? { ...n, disabled: true }
            : n);
        if (removedTriggerNames.size === 0) {
            return { ...workflow, nodes };
        }
        const connections = this.pruneConnectionsTo(workflow.connections, removedTriggerNames);
        return { ...workflow, nodes, connections };
    }
    pruneConnectionsTo(connections, removed) {
        const out = {};
        for (const [sourceNode, byType] of Object.entries(connections)) {
            if (removed.has(sourceNode))
                continue;
            const prunedByType = {};
            for (const [connType, buckets] of Object.entries(byType)) {
                prunedByType[connType] = buckets.map((bucket) => bucket === null ? null : bucket.filter((edge) => !removed.has(edge.node)));
            }
            out[sourceNode] = prunedByType;
        }
        return out;
    }
    assertNoReservedNames(workflow) {
        const offender = workflow.nodes.find((n) => n.name.startsWith(RESERVED_PREFIX));
        if (offender) {
            throw new n8n_workflow_1.UserError(`Node name "${offender.name}" uses the reserved "${RESERVED_PREFIX}" prefix`);
        }
    }
    resolveEntryNode(workflow, config) {
        if (config.startNodeName) {
            return config.startNodeName;
        }
        const triggerNames = workflow.nodes.filter((n) => this.isTrigger(n)).map((n) => n.name);
        const downstream = new Set();
        for (const tName of triggerNames) {
            for (const bucket of workflow.connections[tName]?.main ?? []) {
                for (const edge of bucket ?? [])
                    downstream.add(edge.node);
            }
        }
        if (downstream.size === 0) {
            throw new n8n_workflow_1.UserError('Cannot determine entry node: workflow has no trigger with a downstream connection');
        }
        if (downstream.size > 1) {
            throw new n8n_workflow_1.UserError('Cannot auto-determine entry node: workflow trigger has multiple downstream nodes; set startNodeName explicitly');
        }
        return [...downstream][0];
    }
    isTrigger(node) {
        return /trigger|webhook|manual/i.test(node.type);
    }
    findUserTriggerEdgeTo(connections, entryNodeName, removedTriggerNames) {
        const matches = [];
        for (const [fromNode, conn] of Object.entries(connections)) {
            const buckets = conn.main ?? [];
            for (let bIdx = 0; bIdx < buckets.length; bIdx++) {
                const edges = buckets[bIdx] ?? [];
                if (edges.some((edge) => edge?.node === entryNodeName)) {
                    matches.push({ fromNode, fromBucketIndex: bIdx });
                }
            }
        }
        if (matches.length === 0) {
            throw new n8n_workflow_1.UserError(`No incoming connection to entry node "${entryNodeName}"; cannot inject evaluation trigger`);
        }
        const nonEvalMatch = matches.find((m) => !removedTriggerNames.has(m.fromNode));
        return nonEvalMatch ?? matches[0];
    }
    positionOf(workflow, nodeName) {
        const node = workflow.nodes.find((n) => n.name === nodeName);
        return node?.position;
    }
    buildEvaluationTriggerNode(config, entryPos) {
        const datasetRef = config.datasetSource === 'data_table'
            ? config.datasetRef
            : undefined;
        return {
            id: (0, nanoid_1.nanoid)(),
            name: TRIGGER_NAME,
            type: n8n_workflow_1.EVALUATION_TRIGGER_NODE_TYPE,
            typeVersion: 4.7,
            position: [entryPos[0] - NODE_STEP_X, entryPos[1]],
            parameters: {
                source: 'dataTable',
                dataTableId: datasetRef?.dataTableId ?? '',
            },
        };
    }
    buildMetricNode(metric, x, y) {
        return {
            id: (0, nanoid_1.nanoid)(),
            name: `__eval_metric_${metric.id}`,
            type: n8n_workflow_1.EVALUATION_NODE_TYPE,
            typeVersion: 4.7,
            position: [x, y],
            parameters: this.buildMetricNodeParameters(metric),
        };
    }
    buildMetricNodeParameters(metric) {
        const params = this.metricParametersByType(metric);
        for (const field of DATASET_SOURCED_INPUTS[metric.type]) {
            const value = params[field];
            if (typeof value === 'string') {
                params[field] = resolveDatasetSourcedInput(value);
            }
        }
        return params;
    }
    metricParametersByType(metric) {
        if (metric.type === 'expression') {
            if (metric.config.outputType === 'boolean' &&
                !(0, evaluation_config_validator_1.isCoercibleBooleanExpression)(metric.config.expression)) {
                throw new n8n_workflow_1.UserError(`Metric "${metric.name}" expression cannot be coerced into a boolean (multi-segment templates are not supported)`);
            }
            const value = metric.config.outputType === 'boolean'
                ? coerceBooleanExpression(metric.config.expression)
                : metric.config.expression;
            return {
                operation: 'setMetrics',
                metric: 'customMetrics',
                metrics: {
                    assignments: [{ id: (0, nanoid_1.nanoid)(), name: metric.name, value, type: 'number' }],
                },
            };
        }
        if (metric.type === 'string_similarity') {
            return {
                operation: 'setMetrics',
                metric: 'stringSimilarity',
                actualAnswer: metric.config.inputs.actualAnswer,
                expectedAnswer: metric.config.inputs.expectedAnswer,
                options: { metricName: metric.name },
            };
        }
        if (metric.type === 'categorization') {
            return {
                operation: 'setMetrics',
                metric: 'categorization',
                actualAnswer: metric.config.inputs.actualAnswer,
                expectedAnswer: metric.config.inputs.expectedAnswer,
                options: { metricName: metric.name },
            };
        }
        if (metric.type === 'tools_used') {
            return {
                operation: 'setMetrics',
                metric: 'toolsUsed',
                expectedTools: metric.config.inputs.expectedTools,
                intermediateSteps: metric.config.inputs.intermediateSteps,
                options: { metricName: metric.name },
            };
        }
        const { preset, prompt, inputs } = metric.config;
        return {
            operation: 'setMetrics',
            metric: preset,
            ...(prompt !== undefined ? { prompt } : {}),
            actualAnswer: inputs.actualAnswer,
            ...(preset === 'correctness' ? { expectedAnswer: inputs.expectedAnswer ?? '' } : {}),
            ...(preset === 'helpfulness' ? { userQuery: inputs.userQuery ?? '' } : {}),
            options: {
                metricName: metric.name,
            },
        };
    }
    buildChatModelNodeIfNeeded(metric, metricX, metricY) {
        if (metric.type !== 'llm_judge')
            return [];
        const { typeVersion, model } = this.resolveChatModelShape(metric.config.provider, metric.config.model);
        return [
            {
                id: (0, nanoid_1.nanoid)(),
                name: `__eval_model_${metric.id}`,
                type: metric.config.provider,
                typeVersion,
                position: [metricX, metricY + MODEL_OFFSET_Y],
                credentials: this.credentialsForProvider(metric.config.provider, metric.config.credentialId),
                parameters: { model },
            },
        ];
    }
    resolveChatModelShape(provider, modelId) {
        const legacyShape = { typeVersion: 1, model: modelId };
        try {
            const description = this.nodeTypes.getByNameAndVersion(provider).description;
            const typeVersion = Array.isArray(description.version)
                ? (description.defaultVersion ?? Math.max(...description.version))
                : description.version;
            if (!Number.isFinite(typeVersion))
                return legacyShape;
            return {
                typeVersion,
                model: this.modelExpectsResourceLocator(description, typeVersion)
                    ? { __rl: true, mode: 'list', value: modelId, cachedResultName: modelId }
                    : modelId,
            };
        }
        catch {
            return legacyShape;
        }
    }
    modelExpectsResourceLocator(description, typeVersion) {
        const modelProp = description.properties.find((p) => p.name === 'model' && n8n_workflow_1.NodeHelpers.displayParameter({}, p, { typeVersion }, description));
        return modelProp?.type === 'resourceLocator';
    }
    credentialsForProvider(provider, credentialId) {
        const entry = this.providerRegistry.get(provider);
        if (!entry || entry.credentialTypes.length === 0) {
            throw new n8n_workflow_1.UserError(`Unsupported LLM judge provider "${provider}"`);
        }
        const credentialType = entry.credentialTypes[0].name;
        return { [credentialType]: { id: credentialId, name: '' } };
    }
    rewireConnections(args) {
        const out = (0, n8n_workflow_1.deepCopy)(args.original);
        const { fromNode, fromBucketIndex } = args.userTriggerEdge;
        const buckets = out[fromNode]?.main;
        if (buckets?.[fromBucketIndex]) {
            buckets[fromBucketIndex] = buckets[fromBucketIndex].filter((edge) => edge?.node !== args.entryNodeName);
            if (buckets.every((b) => (b ?? []).length === 0)) {
                delete out[fromNode];
            }
        }
        out[TRIGGER_NAME] = {
            main: [[{ node: args.entryNodeName, type: 'main', index: 0 }]],
        };
        const metricEdges = args.metrics.map((m) => ({
            node: `__eval_metric_${m.id}`,
            type: 'main',
            index: 0,
        }));
        const existingEnd = out[args.endNodeName] ?? {};
        const existingMain = existingEnd.main ?? [];
        const bucketCount = Math.max(existingMain.length, 1);
        out[args.endNodeName] = {
            ...existingEnd,
            main: Array.from({ length: bucketCount }, () => [...metricEdges]),
        };
        for (const m of args.metrics) {
            if (m.type !== 'llm_judge')
                continue;
            const modelNode = `__eval_model_${m.id}`;
            const metricNode = `__eval_metric_${m.id}`;
            out[modelNode] = {
                [n8n_workflow_1.NodeConnectionTypes.AiLanguageModel]: [
                    [{ node: metricNode, type: n8n_workflow_1.NodeConnectionTypes.AiLanguageModel, index: 0 }],
                ],
            };
        }
        return out;
    }
};
exports.WorkflowCompilerService = WorkflowCompilerService;
exports.WorkflowCompilerService = WorkflowCompilerService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [llm_judge_provider_registry_1.LlmJudgeProviderRegistry, node_types_1.NodeTypes])
], WorkflowCompilerService);
function resolveDatasetSourcedInput(value) {
    if (!value.startsWith('='))
        return value;
    return value.replace(/\$json\b/g, () => `$('${TRIGGER_NAME}').item.json`);
}
function coerceBooleanExpression(expression) {
    const match = expression.match(/^=\{\{([\s\S]*)\}\}$/);
    const inner = match ? match[1].trim() : JSON.stringify(expression);
    return `={{ (${inner}) ? 1 : 0 }}`;
}
function tightenAccessPatternSpacing(value, fromName) {
    const name = fromName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return value
        .replace(new RegExp(`\\$\\(\\s*(['"])\\s*${name}\\s*\\1\\s*\\)`, 'g'), (_m, q) => `$(${q}${fromName}${q})`)
        .replace(new RegExp(`\\$node\\[\\s*(['"])\\s*${name}\\s*\\1\\s*\\]`, 'g'), (_m, q) => `$node[${q}${fromName}${q}]`)
        .replace(new RegExp(`\\$items\\(\\s*(['"])\\s*${name}\\s*\\1\\s*([,)])`, 'g'), (_m, q, tail) => `$items(${q}${fromName}${q}${tail}`);
}
function rewriteExpressionValue(value, fromName) {
    return (0, n8n_workflow_1.applyAccessPatterns)(tightenAccessPatternSpacing(value, fromName), fromName, TRIGGER_NAME);
}
function walkExpressions(value, fromName) {
    if (typeof value === 'string') {
        return value.startsWith('=') ? rewriteExpressionValue(value, fromName) : value;
    }
    if (Array.isArray(value))
        return value.map((item) => walkExpressions(item, fromName));
    if (value && typeof value === 'object') {
        const out = {};
        for (const [k, child] of Object.entries(value))
            out[k] = walkExpressions(child, fromName);
        return out;
    }
    return value;
}
function rewriteFormFieldsHtml(parameters, fromName) {
    const formFields = parameters.formFields;
    if (!formFields ||
        typeof formFields !== 'object' ||
        !('values' in formFields) ||
        !Array.isArray(formFields.values)) {
        return parameters;
    }
    const values = formFields.values.map((entry) => {
        if (entry &&
            typeof entry === 'object' &&
            entry.fieldType === 'html' &&
            typeof entry.html === 'string') {
            return {
                ...entry,
                html: rewriteExpressionValue(entry.html, fromName),
            };
        }
        return entry;
    });
    return { ...parameters, formFields: { ...formFields, values } };
}
function rewriteExpressionRefs(parameters, fromName, nodeType) {
    let result = walkExpressions(parameters, fromName);
    if (n8n_workflow_1.NODES_WITH_RENAMABLE_CONTENT.has(nodeType) && typeof result.jsCode === 'string') {
        result = { ...result, jsCode: rewriteExpressionValue(result.jsCode, fromName) };
    }
    if (n8n_workflow_1.NODES_WITH_RENAMEABLE_TOPLEVEL_HTML_CONTENT.has(nodeType) &&
        typeof result.html === 'string') {
        result = { ...result, html: rewriteExpressionValue(result.html, fromName) };
    }
    if (n8n_workflow_1.NODES_WITH_RENAMABLE_FORM_HTML_CONTENT.has(nodeType)) {
        result = rewriteFormFieldsHtml(result, fromName);
    }
    return result;
}
//# sourceMappingURL=workflow-compiler.service.js.map