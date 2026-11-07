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
exports.EvaluationCollectionService = void 0;
const api_types_1 = require("@n8n/api-types");
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const errors_1 = require("@n8n/errors");
const test_runner_service_ee_1 = require("../evaluation.ee/test-runner/test-runner.service.ee");
const telemetry_1 = require("../telemetry");
const workflow_history_service_1 = require("../workflows/workflow-history/workflow-history.service");
const metric_scales_1 = require("./metric-scales");
function advisoryLockSubKey(collectionId) {
    let hash = 0;
    for (let i = 0; i < collectionId.length; i++) {
        hash = (Math.imul(31, hash) + collectionId.charCodeAt(i)) | 0;
    }
    return hash;
}
let EvaluationCollectionService = class EvaluationCollectionService {
    constructor(collectionRepo, testRunRepo, evalConfigRepo, workflowHistoryRepo, publishedVersionRepo, workflowHistoryService, testRunnerService, telemetry, logger, dbLockService) {
        this.collectionRepo = collectionRepo;
        this.testRunRepo = testRunRepo;
        this.evalConfigRepo = evalConfigRepo;
        this.workflowHistoryRepo = workflowHistoryRepo;
        this.publishedVersionRepo = publishedVersionRepo;
        this.workflowHistoryService = workflowHistoryService;
        this.testRunnerService = testRunnerService;
        this.telemetry = telemetry;
        this.logger = logger;
        this.dbLockService = dbLockService;
    }
    async createCollection(user, workflowId, input) {
        const config = await this.evalConfigRepo.findByIdAndWorkflowId(input.evaluationConfigId, workflowId);
        if (!config) {
            throw new errors_1.NotFoundError('EvaluationConfig not found for this workflow');
        }
        for (const [index, v] of input.versions.entries()) {
            if (v.workflowVersionId) {
                const exists = await this.workflowHistoryService.findVersion(workflowId, v.workflowVersionId);
                if (!exists) {
                    throw new errors_1.BadRequestError(`versions[${index}]: workflow version "${v.workflowVersionId}" not found`);
                }
            }
            if (v.existingTestRunId) {
                const run = await this.testRunRepo.findOneBy({ id: v.existingTestRunId });
                if (!run ||
                    run.workflowId !== workflowId ||
                    run.evaluationConfigId !== input.evaluationConfigId) {
                    throw new errors_1.BadRequestError(`versions[${index}]: test run "${v.existingTestRunId}" is not compatible with this collection`);
                }
                if (v.workflowVersionId && run.workflowVersionId !== v.workflowVersionId) {
                    throw new errors_1.BadRequestError(`versions[${index}]: test run "${v.existingTestRunId}" was executed against version "${run.workflowVersionId ?? '(unpinned)'}", not the requested "${v.workflowVersionId}"`);
                }
                if (!run.workflowVersionId) {
                    throw new errors_1.BadRequestError(`versions[${index}]: test run "${v.existingTestRunId}" has no pinned workflow version and cannot be reused in a collection`);
                }
                if (run.status !== 'completed') {
                    throw new errors_1.BadRequestError(`versions[${index}]: test run "${v.existingTestRunId}" has status "${run.status}" and is not a completed result; omit it to run a fresh evaluation`);
                }
            }
        }
        const collection = await this.collectionRepo.createCollection({
            id: (0, nanoid_1.nanoid)(),
            name: input.name,
            description: input.description ?? null,
            workflowId,
            evaluationConfigId: input.evaluationConfigId,
            createdById: user.id,
        });
        const existingRunIds = input.versions
            .filter((v) => v.existingTestRunId)
            .map((v) => v.existingTestRunId);
        if (existingRunIds.length > 0) {
            await this.collectionRepo.addRunsToCollection(collection.id, existingRunIds);
        }
        const configSnapshot = this.freezeConfigSnapshot(config);
        const runsStartedIds = [];
        for (const v of input.versions) {
            if (v.existingTestRunId)
                continue;
            const versionId = v.workflowVersionId ??
                (await this.workflowHistoryService.snapshotCurrent(workflowId)).versionId;
            runsStartedIds.push(await this.startCollectionRun(user, workflowId, {
                collectionId: collection.id,
                workflowVersionId: versionId,
                evaluationConfigId: input.evaluationConfigId,
                configSnapshot,
                concurrency: input.concurrency ?? 1,
            }));
        }
        this.telemetry.track('Eval collection created', {
            user_id: user.id,
            workflow_id: workflowId,
            collection_id: collection.id,
            evaluation_config_id: input.evaluationConfigId,
            version_count: input.versions.length,
            existing_run_count: existingRunIds.length,
            new_run_count: runsStartedIds.length,
            dataset_id: this.extractDatasetId(config),
        });
        const record = this.toRecord(collection, existingRunIds.length + runsStartedIds.length);
        return { record, runsStartedIds };
    }
    async rerunCollection(user, workflowId, collectionId) {
        return await this.withRerunLock(collectionId, async () => {
            const detail = await this.collectionRepo.getDetailByIdAndWorkflowId(collectionId, workflowId);
            if (!detail)
                throw new errors_1.NotFoundError('Collection not found');
            const { collection, runs } = detail;
            if (runs.some((r) => r.status === 'new' || r.status === 'running')) {
                throw new errors_1.BadRequestError('Collection run already in progress');
            }
            const versionIds = [];
            const seenVersions = new Set();
            for (const run of runs) {
                if (run.workflowVersionId && !seenVersions.has(run.workflowVersionId)) {
                    seenVersions.add(run.workflowVersionId);
                    versionIds.push(run.workflowVersionId);
                }
            }
            if (versionIds.length === 0) {
                throw new errors_1.BadRequestError('Collection has no pinned versions to re-run');
            }
            const config = await this.evalConfigRepo.findByIdAndWorkflowId(collection.evaluationConfigId, workflowId);
            if (!config) {
                throw new errors_1.BadRequestError('Evaluation config for this collection no longer exists; cannot re-run');
            }
            const configSnapshot = this.freezeConfigSnapshot(config);
            const runsStartedIds = [];
            try {
                for (const versionId of versionIds) {
                    runsStartedIds.push(await this.startCollectionRun(user, workflowId, {
                        collectionId: collection.id,
                        workflowVersionId: versionId,
                        evaluationConfigId: collection.evaluationConfigId,
                        configSnapshot,
                        concurrency: 1,
                    }));
                }
                await this.collectionRepo.removeRunsFromCollection(collection.id, runs.map((run) => run.id));
            }
            catch (error) {
                for (const runId of runsStartedIds) {
                    await this.testRunnerService.cancelTestRun(runId).catch(() => { });
                }
                try {
                    await this.collectionRepo.removeRunsFromCollection(collection.id, runsStartedIds);
                }
                catch (cleanupError) {
                    this.logger.error('Failed to roll back eval collection re-run; collection may contain a mixed run set', { collectionId: collection.id, error: cleanupError });
                }
                throw error;
            }
            await this.collectionRepo.updateInsightsCache(collection.id, null);
            this.telemetry.track('Eval collection rerun', {
                user_id: user.id,
                workflow_id: workflowId,
                collection_id: collection.id,
                evaluation_config_id: collection.evaluationConfigId,
                version_count: versionIds.length,
                new_run_count: runsStartedIds.length,
                dataset_id: this.extractDatasetId(config),
            });
            const record = this.toRecord(collection, runsStartedIds.length);
            return { record, runsStartedIds };
        });
    }
    async withRerunLock(collectionId, fn) {
        let entered = false;
        try {
            return await this.dbLockService.tryWithLock(1006, async () => {
                entered = true;
                return await fn();
            }, { subKey: advisoryLockSubKey(collectionId) });
        }
        catch (error) {
            if (!entered && error instanceof n8n_workflow_1.OperationalError) {
                throw new errors_1.BadRequestError('Collection run already in progress');
            }
            throw error;
        }
    }
    async listCollections(workflowId) {
        const items = await this.collectionRepo.listByWorkflowId(workflowId);
        return items.map(({ runCount, ...c }) => this.toRecord(c, runCount));
    }
    async getCollectionDetail(workflowId, collectionId) {
        const detail = await this.collectionRepo.getDetailByIdAndWorkflowId(collectionId, workflowId);
        if (!detail)
            throw new errors_1.NotFoundError('Collection not found');
        const defaultScales = await (0, metric_scales_1.resolveConfigMetricScales)(this.evalConfigRepo, detail.collection.evaluationConfigId, workflowId);
        const runs = detail.runs.map((r) => this.toRunSummary(r, defaultScales));
        return { ...this.toRecord(detail.collection, runs.length), runs, metricScales: defaultScales };
    }
    async updateCollectionMeta(workflowId, collectionId, input) {
        const updated = await this.collectionRepo.updateMeta(collectionId, workflowId, input);
        if (!updated)
            throw new errors_1.NotFoundError('Collection not found');
        const runCount = await this.testRunRepo.count({ where: { collectionId } });
        return this.toRecord(updated, runCount);
    }
    async deleteCollection(user, workflowId, collectionId) {
        const owned = await this.collectionRepo.findByIdAndWorkflowId(collectionId, workflowId);
        if (!owned)
            throw new errors_1.NotFoundError('Collection not found');
        const active = await this.testRunRepo.find({
            where: [
                { collectionId, status: 'running' },
                { collectionId, status: 'new' },
            ],
            select: ['id'],
        });
        if (active.length > 0) {
            await this.testRunnerService.cancelCollection(collectionId);
        }
        const { deleted, runsUnlinked } = await this.collectionRepo.deleteByIdAndWorkflowId(collectionId, workflowId);
        if (!deleted)
            throw new errors_1.NotFoundError('Collection not found');
        this.telemetry.track('Eval collection deleted', {
            user_id: user.id,
            workflow_id: workflowId,
            collection_id: collectionId,
            runs_unlinked: runsUnlinked,
        });
        return { runsUnlinked };
    }
    async addRunToCollection(workflowId, collectionId, testRunId) {
        const collection = await this.collectionRepo.findByIdAndWorkflowId(collectionId, workflowId);
        if (!collection)
            throw new errors_1.NotFoundError('Collection not found');
        const run = await this.testRunRepo.findOneBy({ id: testRunId });
        if (!run || run.workflowId !== workflowId) {
            throw new errors_1.NotFoundError('Test run not found for this workflow');
        }
        if (run.evaluationConfigId !== collection.evaluationConfigId) {
            throw new errors_1.BadRequestError('Test run is not compatible with this collection (different evaluation config)');
        }
        if (!run.workflowVersionId) {
            throw new errors_1.BadRequestError('Test run has no pinned workflow version and cannot be added to a collection');
        }
        await this.collectionRepo.addRunsToCollection(collectionId, [testRunId]);
        await this.collectionRepo.updateInsightsCache(collectionId, null);
        return await this.getCollectionDetail(workflowId, collectionId);
    }
    async removeRunFromCollection(workflowId, collectionId, testRunId) {
        const collection = await this.collectionRepo.findByIdAndWorkflowId(collectionId, workflowId);
        if (!collection)
            throw new errors_1.NotFoundError('Collection not found');
        const affected = await this.collectionRepo.removeRunFromCollection(collectionId, testRunId);
        if (affected === 0) {
            throw new errors_1.NotFoundError('Test run is not part of this collection');
        }
        await this.collectionRepo.updateInsightsCache(collectionId, null);
        return await this.getCollectionDetail(workflowId, collectionId);
    }
    async getEvalVersions(workflowId, evaluationConfigId) {
        const config = await this.evalConfigRepo.findByIdAndWorkflowId(evaluationConfigId, workflowId);
        if (!config) {
            throw new errors_1.NotFoundError('EvaluationConfig not found for this workflow');
        }
        const scaleByMetric = (0, api_types_1.metricScalesFromConfig)(config.metrics);
        const history = await this.workflowHistoryRepo.find({
            where: { workflowId },
            order: { createdAt: 'DESC' },
            select: ['versionId', 'name', 'autosaved', 'createdAt'],
        });
        const lastRuns = history.length === 0
            ? []
            : await this.testRunRepo.findByConfigAndVersions(evaluationConfigId, history.map((h) => h.versionId));
        const latestRunByVersion = new Map();
        for (const run of lastRuns) {
            if (run.workflowVersionId &&
                run.status === 'completed' &&
                !latestRunByVersion.has(run.workflowVersionId)) {
                latestRunByVersion.set(run.workflowVersionId, run);
            }
        }
        const publishedRow = await this.publishedVersionRepo.findOneBy({ workflowId });
        const publishedVersionId = publishedRow?.publishedVersionId ?? null;
        const versions = [];
        versions.push({
            workflowVersionId: null,
            label: 'Current draft',
            sourceLabel: 'Live workflow',
            isCurrent: true,
            lastRun: null,
        });
        for (const h of history) {
            const lastRun = latestRunByVersion.get(h.versionId) ?? null;
            versions.push({
                workflowVersionId: h.versionId,
                label: h.name ?? this.shortVersionLabel(h.versionId),
                sourceLabel: this.formatSourceLabel(h, h.versionId === publishedVersionId),
                isCurrent: false,
                lastRun: lastRun
                    ? {
                        testRunId: lastRun.id,
                        runAt: (lastRun.runAt ?? lastRun.createdAt).toISOString(),
                        status: lastRun.status,
                        avgScore: this.computeAvgScore(lastRun, scaleByMetric),
                        isBest: false,
                        isCritical: false,
                    }
                    : null,
            });
        }
        const scored = versions.filter((v) => v.lastRun?.avgScore !== null && v.lastRun !== null);
        if (scored.length > 0) {
            const best = scored.reduce((acc, v) => (v.lastRun.avgScore ?? -Infinity) > (acc.lastRun.avgScore ?? -Infinity) ? v : acc);
            if (best.lastRun)
                best.lastRun.isBest = true;
            for (const v of scored) {
                if (v.lastRun && v.lastRun.avgScore !== null && v.lastRun.avgScore < 0.6) {
                    v.lastRun.isCritical = true;
                }
            }
        }
        return { evaluationConfigId, versions };
    }
    freezeConfigSnapshot(config) {
        return {
            ...config,
            createdAt: config.createdAt.toISOString(),
            updatedAt: config.updatedAt.toISOString(),
        };
    }
    async startCollectionRun(user, workflowId, options) {
        const { testRun } = await this.testRunnerService.startTestRun(user, workflowId, options.concurrency, {
            collectionId: options.collectionId,
            workflowVersionId: options.workflowVersionId,
            evaluationConfigId: options.evaluationConfigId,
            evaluationConfigSnapshot: options.configSnapshot,
            compileFromConfig: true,
        });
        return testRun.id;
    }
    toRecord(collection, runCount) {
        return {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            workflowId: collection.workflowId,
            evaluationConfigId: collection.evaluationConfigId,
            createdById: collection.createdById,
            createdAt: collection.createdAt.toISOString(),
            updatedAt: collection.updatedAt.toISOString(),
            runCount,
        };
    }
    toRunSummary(run, defaultScales) {
        const scaleByMetric = (0, metric_scales_1.runMetricScales)(run, defaultScales);
        return {
            testRunId: run.id,
            workflowVersionId: run.workflowVersionId,
            status: run.status,
            runAt: run.runAt ? run.runAt.toISOString() : null,
            completedAt: run.completedAt ? run.completedAt.toISOString() : null,
            avgScore: this.computeAvgScore(run, scaleByMetric),
            metrics: this.coerceMetrics(run.metrics),
            metricScales: scaleByMetric,
        };
    }
    computeAvgScore(run, scaleByMetric) {
        const coerced = this.coerceMetrics(run.metrics);
        if (!coerced)
            return null;
        const scores = Object.entries(coerced)
            .map(([key, value]) => (0, api_types_1.normalizeMetricScore)(key, value, scaleByMetric[key]))
            .filter((value) => value !== null);
        if (scores.length === 0)
            return null;
        return scores.reduce((acc, value) => acc + value, 0) / scores.length;
    }
    coerceMetrics(metrics) {
        if (!metrics)
            return null;
        const out = {};
        for (const [k, v] of Object.entries(metrics)) {
            if (typeof v === 'number')
                out[k] = v;
            else if (typeof v === 'boolean')
                out[k] = v ? 1 : 0;
        }
        return Object.keys(out).length > 0 ? out : null;
    }
    extractDatasetId(config) {
        if (config.datasetSource === 'data_table' &&
            typeof config.datasetRef === 'object' &&
            config.datasetRef !== null &&
            'dataTableId' in config.datasetRef) {
            return String(config.datasetRef.dataTableId);
        }
        return null;
    }
    shortVersionLabel(versionId) {
        return `v ${versionId.slice(0, 8)}`;
    }
    formatDateLabel(date) {
        return date.toISOString().slice(0, 10);
    }
    formatSourceLabel(h, isPublished) {
        const date = this.formatDateLabel(h.createdAt);
        if (isPublished)
            return `Published · ${date}`;
        if (h.name)
            return `Named · ${date}`;
        if (h.autosaved)
            return `Autosaved · ${date}`;
        return `Snapshot · ${date}`;
    }
};
exports.EvaluationCollectionService = EvaluationCollectionService;
exports.EvaluationCollectionService = EvaluationCollectionService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.EvaluationCollectionRepository, db_1.TestRunRepository, db_1.EvaluationConfigRepository, db_1.WorkflowHistoryRepository, db_1.WorkflowPublishedVersionRepository, workflow_history_service_1.WorkflowHistoryService, test_runner_service_ee_1.TestRunnerService, telemetry_1.Telemetry, backend_common_1.Logger, db_1.DbLockService])
], EvaluationCollectionService);
//# sourceMappingURL=evaluation-collection.service.js.map