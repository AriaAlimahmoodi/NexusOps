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
exports.InsightsContextBuilder = void 0;
const api_types_1 = require("@n8n/api-types");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const MAX_CASES_PER_VERSION = 10;
const MAX_FIELD_CHARS = 400;
const MAX_DIFF_NAMES = 15;
const PROMPT_FIELD_KEYS = new Set(['systemmessage', 'systemprompt', 'prompt', 'text']);
const CASE_FETCH_LIMIT = 100;
const toPercent = (score) => score === null ? null : Math.round(score * 100);
const truncate = (value) => value.length > MAX_FIELD_CHARS ? `${value.slice(0, MAX_FIELD_CHARS)}…` : value;
const stringify = (value) => {
    if (value === null || value === undefined)
        return '';
    if (typeof value === 'string')
        return value;
    try {
        return JSON.stringify(value);
    }
    catch {
        return '';
    }
};
const scoresToPercent = (scores) => {
    const out = {};
    for (const [key, value] of Object.entries(scores))
        out[key] = Math.round(value * 100);
    return out;
};
const collectPromptFields = (params, path = '') => {
    const out = {};
    if (!params || typeof params !== 'object')
        return out;
    for (const [key, value] of Object.entries(params)) {
        const nextPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
            if (PROMPT_FIELD_KEYS.has(key.toLowerCase()) && value.trim() !== '')
                out[nextPath] = value;
        }
        else if (value && typeof value === 'object') {
            Object.assign(out, collectPromptFields(value, nextPath));
        }
    }
    return out;
};
const promptChangesBetween = (base, version) => {
    const before = collectPromptFields(base?.parameters);
    const after = collectPromptFields(version?.parameters);
    const changes = [];
    for (const field of new Set([...Object.keys(before), ...Object.keys(after)])) {
        const b = before[field] ?? '';
        const a = after[field] ?? '';
        if (b !== a)
            changes.push({ field, before: truncate(b), after: truncate(a) });
    }
    return changes;
};
let InsightsContextBuilder = class InsightsContextBuilder {
    constructor(workflowHistoryRepo, testCaseExecutionRepo) {
        this.workflowHistoryRepo = workflowHistoryRepo;
        this.testCaseExecutionRepo = testCaseExecutionRepo;
    }
    async build(workflowId, params) {
        const { collectionName, versions, winnerLabel } = params;
        const base = versions.find((version) => version.versionLabel === winnerLabel) ?? versions[0];
        const baseNodes = await this.loadNodes(workflowId, base.workflowVersionId);
        const baseCasesByIndex = await this.loadCasesByRunIndex(base.testRunId);
        const versionViews = [];
        for (const version of versions) {
            const isBase = version.versionLabel === base.versionLabel;
            versionViews.push({
                label: version.versionLabel,
                isBase,
                avgScorePercent: toPercent(version.avgScore),
                metricScores: scoresToPercent(version.scores),
                workflowDiff: isBase ? null : await this.diff(workflowId, baseNodes, version),
                regressedCases: isBase
                    ? []
                    :
                        await this.regressedCases(baseCasesByIndex, base.metricScales, version),
            });
        }
        return { collectionName, baseVersionLabel: base.versionLabel, versions: versionViews };
    }
    async loadNodes(workflowId, versionId) {
        if (!versionId)
            return null;
        const snapshot = await this.workflowHistoryRepo.findOne({ where: { workflowId, versionId } });
        return snapshot?.nodes ?? null;
    }
    async loadCasesByRunIndex(testRunId) {
        const cases = await this.testCaseExecutionRepo.getManyByTestRunId(testRunId, {
            offset: 0,
            limit: CASE_FETCH_LIMIT,
        });
        const byIndex = new Map();
        cases.forEach((testCase, position) => {
            const key = testCase.runIndex ?? position;
            byIndex.set(key, { metrics: testCase.metrics, outputs: testCase.outputs });
        });
        return byIndex;
    }
    async diff(workflowId, baseNodes, version) {
        const versionNodes = await this.loadNodes(workflowId, version.workflowVersionId);
        if (!baseNodes || !versionNodes)
            return null;
        const diff = (0, n8n_workflow_1.compareWorkflowsNodes)(baseNodes, versionNodes);
        const baseById = new Map(baseNodes.map((n) => [n.id, n]));
        const versionById = new Map(versionNodes.map((n) => [n.id, n]));
        const added = [];
        const removed = [];
        const modified = [];
        for (const { status, node } of diff.values()) {
            const label = `${node.name} (${node.type})`;
            if (status === "added")
                added.push(label);
            else if (status === "deleted")
                removed.push(label);
            else if (status === "modified") {
                modified.push({
                    node: label,
                    promptChanges: promptChangesBetween(baseById.get(node.id), versionById.get(node.id)),
                });
            }
        }
        return {
            added: added.slice(0, MAX_DIFF_NAMES),
            removed: removed.slice(0, MAX_DIFF_NAMES),
            modified: modified.slice(0, MAX_DIFF_NAMES),
        };
    }
    async regressedCases(baseCasesByIndex, baseScales, version) {
        const versionCases = await this.testCaseExecutionRepo.getManyByTestRunId(version.testRunId, {
            offset: 0,
            limit: CASE_FETCH_LIMIT,
        });
        const rows = [];
        versionCases.forEach((testCase, position) => {
            const key = testCase.runIndex ?? position;
            const baseCase = baseCasesByIndex.get(key);
            const baseScore = (0, api_types_1.averageNormalizedScore)(baseCase?.metrics, baseScales);
            const versionScore = (0, api_types_1.averageNormalizedScore)(testCase.metrics, version.metricScales);
            if (baseScore === null || versionScore === null)
                return;
            const drop = baseScore - versionScore;
            if (drop <= 0)
                return;
            rows.push({
                drop,
                caseNumber: key + 1,
                input: truncate(stringify(testCase.inputs)),
                baseOutput: truncate(stringify(baseCase?.outputs)),
                versionOutput: truncate(stringify(testCase.outputs)),
                baseScorePercent: toPercent(baseScore),
                versionScorePercent: toPercent(versionScore),
            });
        });
        return rows
            .sort((a, b) => b.drop - a.drop)
            .slice(0, MAX_CASES_PER_VERSION)
            .map(({ drop: _drop, ...rest }) => rest);
    }
};
exports.InsightsContextBuilder = InsightsContextBuilder;
exports.InsightsContextBuilder = InsightsContextBuilder = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.WorkflowHistoryRepository, db_1.TestCaseExecutionRepository])
], InsightsContextBuilder);
//# sourceMappingURL=insights-context-builder.js.map