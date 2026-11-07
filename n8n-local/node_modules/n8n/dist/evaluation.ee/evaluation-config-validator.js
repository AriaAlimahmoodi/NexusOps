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
exports.EvaluationConfigValidator = void 0;
exports.isCoercibleBooleanExpression = isCoercibleBooleanExpression;
const api_types_1 = require("@n8n/api-types");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const backend_services_1 = require("@n8n/backend-services");
const data_table_repository_1 = require("../modules/data-table/data-table.repository");
const llm_judge_provider_registry_1 = require("./llm-judge-provider-registry");
const RESERVED_PREFIX = '__eval_';
let EvaluationConfigValidator = class EvaluationConfigValidator {
    constructor(dataTableRepository, credentialsFinder, providerRegistry) {
        this.dataTableRepository = dataTableRepository;
        this.credentialsFinder = credentialsFinder;
        this.providerRegistry = providerRegistry;
    }
    async validate(args) {
        const errors = [];
        this.checkNodeReferences(args, errors);
        this.checkReservedPrefix(args, errors);
        this.checkEntryAmbiguity(args, errors);
        this.checkReachability(args, errors);
        this.checkMetricUniqueness(args, errors);
        this.checkBooleanCoercion(args, errors);
        this.checkMetricInputsNonEmpty(args, errors);
        this.checkDatasetSource(args, errors);
        await this.checkDataTableAccess(args, errors);
        await this.checkLlmJudgeProvidersAndCredentials(args, errors);
        return errors;
    }
    checkMetricInputsNonEmpty(args, errors) {
        for (const metric of args.config.metrics) {
            for (const { name, path, value } of collectMetricInputStrings(metric)) {
                if (typeof value !== 'string' || value.trim().length === 0) {
                    errors.push({
                        code: api_types_1.EvaluationErrorCode.METRIC_INPUT_EMPTY,
                        message: `Metric "${metric.name}" input "${name}" must not be empty`,
                        details: {
                            metricId: metric.id,
                            metricName: metric.name,
                            field: path,
                        },
                    });
                }
            }
        }
    }
    getNodeByName(workflow, name) {
        return workflow.nodes.find((n) => n.name === name);
    }
    llmJudgeMetrics(config) {
        return config.metrics.filter((m) => m.type === 'llm_judge');
    }
    checkNodeReferences(args, errors) {
        const { workflow, config } = args;
        if (!this.getNodeByName(workflow, config.startNodeName)) {
            errors.push({
                code: api_types_1.EvaluationErrorCode.START_NODE_NOT_FOUND,
                message: `Start node "${config.startNodeName}" was not found on the workflow`,
                details: { nodeName: config.startNodeName, field: 'startNodeName' },
            });
        }
        if (!this.getNodeByName(workflow, config.endNodeName)) {
            errors.push({
                code: api_types_1.EvaluationErrorCode.END_NODE_NOT_FOUND,
                message: `End node "${config.endNodeName}" was not found on the workflow`,
                details: { nodeName: config.endNodeName, field: 'endNodeName' },
            });
        }
    }
    checkReservedPrefix(args, errors) {
        for (const node of args.workflow.nodes) {
            if (node.name.startsWith(RESERVED_PREFIX)) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.RESERVED_PREFIX_IN_USE,
                    message: `Node "${node.name}" uses the reserved "${RESERVED_PREFIX}" prefix`,
                    details: { nodeName: node.name },
                });
            }
        }
    }
    checkEntryAmbiguity(args, errors) {
        const { workflow, config } = args;
        if (!this.getNodeByName(workflow, config.startNodeName))
            return;
        const byDest = (0, n8n_workflow_1.mapConnectionsByDestination)(workflow.connections);
        const parents = (0, n8n_workflow_1.getParentNodes)(byDest, config.startNodeName, 'main', 1);
        const nonEvalParents = parents.filter((name) => this.getNodeByName(workflow, name)?.type !== n8n_workflow_1.EVALUATION_TRIGGER_NODE_TYPE);
        if (nonEvalParents.length > 1) {
            errors.push({
                code: api_types_1.EvaluationErrorCode.AMBIGUOUS_ENTRY_NODE,
                message: `Entry node "${config.startNodeName}" has multiple upstream parents (${nonEvalParents.join(', ')})`,
                details: { nodeName: config.startNodeName },
            });
        }
    }
    checkReachability(args, errors) {
        const { workflow, config } = args;
        if (!this.getNodeByName(workflow, config.startNodeName))
            return;
        if (!this.getNodeByName(workflow, config.endNodeName))
            return;
        if (config.startNodeName === config.endNodeName)
            return;
        const descendants = new Set((0, n8n_workflow_1.getChildNodes)(workflow.connections, config.startNodeName, 'main'));
        if (!descendants.has(config.endNodeName)) {
            errors.push({
                code: api_types_1.EvaluationErrorCode.END_NODE_UNREACHABLE,
                message: `End node "${config.endNodeName}" is not reachable from start node "${config.startNodeName}"`,
                details: { nodeName: config.endNodeName, field: 'endNodeName' },
            });
        }
    }
    checkMetricUniqueness(args, errors) {
        const seenIds = new Map();
        const seenNames = new Map();
        for (const m of args.config.metrics) {
            seenIds.set(m.id, (seenIds.get(m.id) ?? 0) + 1);
            seenNames.set(m.name, (seenNames.get(m.name) ?? 0) + 1);
        }
        for (const [id, count] of seenIds) {
            if (count > 1) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.DUPLICATE_METRIC_ID,
                    message: `Metric id "${id}" appears ${count} times`,
                    details: { metricId: id },
                });
            }
        }
        for (const [name, count] of seenNames) {
            if (count > 1) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.DUPLICATE_METRIC_NAME,
                    message: `Metric name "${name}" appears ${count} times`,
                    details: { metricName: name },
                });
            }
        }
    }
    checkBooleanCoercion(args, errors) {
        for (const metric of args.config.metrics) {
            if (metric.type !== 'expression')
                continue;
            if (metric.config.outputType !== 'boolean')
                continue;
            if (!isCoercibleBooleanExpression(metric.config.expression)) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.BOOLEAN_COERCION_UNSUPPORTED,
                    message: `Metric "${metric.name}" expression cannot be coerced into a boolean`,
                    details: { metricId: metric.id, metricName: metric.name, field: 'config.expression' },
                });
            }
        }
    }
    checkDatasetSource(args, errors) {
        if (args.config.datasetSource === 'google_sheets') {
            errors.push({
                code: api_types_1.EvaluationErrorCode.UNSUPPORTED_DATASET_SOURCE,
                message: 'Google Sheets datasets are accepted by the schema but not yet runnable',
                details: { field: 'datasetSource' },
            });
        }
    }
    async checkDataTableAccess(args, errors) {
        if (args.config.datasetSource !== 'data_table')
            return;
        const datasetRef = args.config.datasetRef;
        const { dataTableId } = datasetRef;
        const table = await this.dataTableRepository.findOne({
            where: { id: dataTableId },
            relations: ['project'],
        });
        if (!table) {
            errors.push({
                code: api_types_1.EvaluationErrorCode.DATASET_NOT_FOUND,
                message: `Data table "${dataTableId}" was not found`,
                details: { field: 'datasetRef.dataTableId' },
            });
            return;
        }
    }
    async checkLlmJudgeProvidersAndCredentials(args, errors) {
        const metrics = this.llmJudgeMetrics(args.config);
        for (const metric of metrics) {
            const entry = this.providerRegistry.get(metric.config.provider);
            if (!entry) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.LLM_PROVIDER_UNSUPPORTED,
                    message: `LLM provider "${metric.config.provider}" is not supported`,
                    details: {
                        nodeType: metric.config.provider,
                        metricId: metric.id,
                        metricName: metric.name,
                    },
                });
                continue;
            }
            const credential = await this.credentialsFinder.findCredentialForUser(metric.config.credentialId, args.user, ['credential:read']);
            if (!credential) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.LLM_CREDENTIAL_ACCESS_DENIED,
                    message: `Credential "${metric.config.credentialId}" is not accessible to the user`,
                    details: {
                        credentialId: metric.config.credentialId,
                        metricId: metric.id,
                        metricName: metric.name,
                    },
                });
                continue;
            }
            const accepted = entry.credentialTypes.map((c) => c.name);
            if (!accepted.includes(credential.type)) {
                errors.push({
                    code: api_types_1.EvaluationErrorCode.LLM_CREDENTIAL_TYPE_MISMATCH,
                    message: `Credential type "${credential.type}" does not match provider "${entry.nodeType}" (expected one of: ${accepted.join(', ')})`,
                    details: {
                        credentialId: metric.config.credentialId,
                        metricId: metric.id,
                        metricName: metric.name,
                        nodeType: entry.nodeType,
                    },
                });
            }
        }
    }
};
exports.EvaluationConfigValidator = EvaluationConfigValidator;
exports.EvaluationConfigValidator = EvaluationConfigValidator = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [data_table_repository_1.DataTableRepository, backend_services_1.CredentialsFinderService, llm_judge_provider_registry_1.LlmJudgeProviderRegistry])
], EvaluationConfigValidator);
function collectMetricInputStrings(metric) {
    if (metric.type === 'expression') {
        return [{ name: 'expression', path: 'config.expression', value: metric.config.expression }];
    }
    if (metric.type === 'llm_judge') {
        const { actualAnswer, expectedAnswer, userQuery } = metric.config.inputs;
        const out = [
            { name: 'actualAnswer', path: 'config.inputs.actualAnswer', value: actualAnswer },
        ];
        if (expectedAnswer !== undefined) {
            out.push({
                name: 'expectedAnswer',
                path: 'config.inputs.expectedAnswer',
                value: expectedAnswer,
            });
        }
        if (userQuery !== undefined) {
            out.push({ name: 'userQuery', path: 'config.inputs.userQuery', value: userQuery });
        }
        return out;
    }
    if (metric.type === 'string_similarity' || metric.type === 'categorization') {
        return [
            {
                name: 'actualAnswer',
                path: 'config.inputs.actualAnswer',
                value: metric.config.inputs.actualAnswer,
            },
            {
                name: 'expectedAnswer',
                path: 'config.inputs.expectedAnswer',
                value: metric.config.inputs.expectedAnswer,
            },
        ];
    }
    if (metric.type === 'tools_used') {
        return [
            {
                name: 'expectedTools',
                path: 'config.inputs.expectedTools',
                value: metric.config.inputs.expectedTools,
            },
            {
                name: 'intermediateSteps',
                path: 'config.inputs.intermediateSteps',
                value: metric.config.inputs.intermediateSteps,
            },
        ];
    }
    return [];
}
function isCoercibleBooleanExpression(expression) {
    const trimmed = expression.trimStart();
    if (!trimmed.startsWith('='))
        return true;
    const body = trimmed.slice(1).trim();
    const segmentMatches = body.match(/\{\{[\s\S]*?\}\}/g) ?? [];
    if (segmentMatches.length === 0)
        return true;
    const stripped = body.replace(/\{\{[\s\S]*?\}\}/g, '').trim();
    return stripped === '' && segmentMatches.length === 1;
}
//# sourceMappingURL=evaluation-config-validator.js.map