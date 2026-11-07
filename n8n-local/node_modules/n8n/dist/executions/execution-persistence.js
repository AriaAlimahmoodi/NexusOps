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
var ExecutionPersistence_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutionPersistence = void 0;
const backend_common_1 = require("@n8n/backend-common");
const backend_services_1 = require("@n8n/backend-services");
const config_1 = require("@n8n/config");
const constants_1 = require("@n8n/constants");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const flatted_1 = require("flatted");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const corrupted_execution_data_error_1 = require("./execution-data/corrupted-execution-data.error");
const db_store_1 = require("./execution-data/db-store");
const execution_data_json_store_1 = require("./execution-data/execution-data-json-store");
const missing_execution_data_error_1 = require("./execution-data/missing-execution-data.error");
const types_1 = require("./execution-data/types");
const unreadable_run_data_error_1 = require("./execution-data/unreadable-run-data.error");
const sum_binary_data_bytes_1 = require("./sum-binary-data-bytes");
const duplicate_execution_error_1 = require("../errors/duplicate-execution.error");
let ExecutionPersistence = ExecutionPersistence_1 = class ExecutionPersistence {
    constructor(executionRepository, binaryDataService, jsonStore, dbStore, storageConfig, executionsConfig, databaseConfig, errorReporter, eventService) {
        this.executionRepository = executionRepository;
        this.binaryDataService = binaryDataService;
        this.jsonStore = jsonStore;
        this.dbStore = dbStore;
        this.storageConfig = storageConfig;
        this.executionsConfig = executionsConfig;
        this.databaseConfig = databaseConfig;
        this.errorReporter = errorReporter;
        this.eventService = eventService;
    }
    async create(payload, ctx = {}) {
        const { data: rawData, workflowData, ...rest } = payload;
        const { id } = workflowData;
        const workflowSnapshot = (0, types_1.toWorkflowSnapshot)(workflowData);
        const storedAt = this.storageConfig.modeTag;
        const workflowVersionId = workflowData.versionId ?? null;
        const executionEntity = { ...rest, createdAt: new Date(), storedAt, workflowVersionId };
        let reclaimedTombstone = null;
        try {
            const executionId = await this.executionRepository.runInTransaction(ctx, async (tx) => {
                reclaimedTombstone = await this.reclaimTombstone(tx, executionEntity.deduplicationKey);
                const { identifiers } = await tx.insert(db_1.ExecutionEntity, executionEntity);
                const executionId = String(identifiers[0].id);
                const ref = { workflowId: id, executionId };
                const jsonSizeBytes = await this.trackWrite(storedAt, ref.workflowId, async () => {
                    const bundle = {
                        data: (0, flatted_1.stringify)(rawData),
                        workflowData: workflowSnapshot,
                        workflowVersionId,
                    };
                    return await this.writeData(storedAt, ref, bundle, tx);
                });
                const binaryDataSizeBytes = (0, sum_binary_data_bytes_1.sumBinaryDataBytes)(rawData);
                await tx.update(db_1.ExecutionEntity, { id: executionId }, { jsonSizeBytes, binaryDataSizeBytes });
                return executionId;
            });
            await this.deleteReclaimedTombstoneData(reclaimedTombstone);
            return executionId;
        }
        catch (error) {
            if (executionEntity.deduplicationKey && this.isDuplicateExecutionError(error)) {
                throw new duplicate_execution_error_1.DuplicateExecutionError(executionEntity.deduplicationKey, error);
            }
            throw error;
        }
    }
    async reclaimTombstone(tx, deduplicationKey) {
        if (!deduplicationKey)
            return null;
        const tombstone = await tx.findOne(db_1.ExecutionEntity, {
            where: { deduplicationKey, status: 'new' },
            select: ['id', 'workflowId', 'storedAt'],
        });
        if (!tombstone)
            return null;
        const { affected } = await tx.delete(db_1.ExecutionEntity, { id: tombstone.id, status: 'new' });
        if (!affected)
            return null;
        return {
            workflowId: tombstone.workflowId,
            executionId: tombstone.id,
            storedAt: tombstone.storedAt,
        };
    }
    async deleteReclaimedTombstoneData(target) {
        if (!target)
            return;
        const blobRefs = this.toBlobRefs([target]);
        if (blobRefs.length === 0)
            return;
        try {
            await this.jsonStore.delete(blobRefs);
        }
        catch (error) {
            this.errorReporter.error(error, {
                extra: { executionId: target.executionId, storedAt: target.storedAt },
            });
        }
    }
    async updateExistingExecution(executionId, execution, conditions) {
        const hasDataField = execution.data !== undefined || execution.workflowData !== undefined;
        if (!hasDataField) {
            return await this.updateEntityOnly(executionId, execution, conditions);
        }
        const entity = await this.executionRepository.findOne({
            where: this.buildEntityWhereCondition(executionId, conditions),
            select: ['id', 'workflowId', 'storedAt', 'workflowVersionId'],
        });
        if (!entity)
            return false;
        const ref = { workflowId: entity.workflowId, executionId };
        return await this.applyDataUpdate(ref, entity.storedAt, entity.workflowVersionId, execution, conditions);
    }
    async findSingleExecution(id, options) {
        if (!options?.includeData) {
            return await this.executionRepository.findSingleExecution(id, options);
        }
        const entity = await this.executionRepository.findOne({
            where: { id, ...options.where },
            relations: {
                metadata: true,
                ...(options.includeAnnotation ? { annotation: { tags: true } } : {}),
            },
        });
        if (!entity)
            return undefined;
        const max = this.maxDisplayDataSize(options);
        const ref = { workflowId: entity.workflowId, executionId: entity.id };
        if (this.isKnownOversize(entity, max)) {
            return (await this.assembleSkippedExecution(entity, ref, options));
        }
        if (max > 0 && entity.jsonSizeBytes === 0 && entity.storedAt === 'db') {
            const size = await this.dbStore.getDataByteSize(ref);
            if (size !== null && size > max) {
                return (await this.assembleSkippedExecution(entity, ref, options));
            }
        }
        const start = Date.now();
        let success = false;
        let unreadableBundles = 0;
        try {
            const bundle = await this.readData(entity.storedAt, ref);
            if (!bundle) {
                unreadableBundles = 1;
                if (entity.storedAt === 'db') {
                    this.executionRepository.reportInvalidExecutions([entity]);
                    return undefined;
                }
                throw new missing_execution_data_error_1.MissingExecutionDataError(ref);
            }
            const assembled = await this.assembleReadExecution(entity, bundle, options, max);
            success = true;
            return assembled;
        }
        catch (error) {
            if (error instanceof corrupted_execution_data_error_1.CorruptedExecutionDataError)
                unreadableBundles = 1;
            throw error;
        }
        finally {
            this.eventService.emit('execution-data-read', {
                mode: entity.storedAt,
                durationMs: Date.now() - start,
                success,
                unreadableBundles,
            });
        }
    }
    async findMultipleExecutions(queryParams, options) {
        if (!options?.includeData) {
            return await this.executionRepository.findMultipleExecutions(queryParams, options);
        }
        const { executions } = await this.readMultiple(queryParams, options);
        return executions;
    }
    async findMultipleExecutionsWithUnreadable(queryParams) {
        const { executions, unreadableIds } = await this.readMultiple(queryParams, {
            includeData: true,
            unflattenData: true,
        });
        return { executions: executions, unreadableIds };
    }
    async readMultiple(queryParams, options) {
        queryParams.relations ??= [];
        if (Array.isArray(queryParams.relations)) {
            if (!queryParams.relations.includes('metadata'))
                queryParams.relations.push('metadata');
        }
        else {
            queryParams.relations.metadata = true;
        }
        const max = this.maxDisplayDataSize(options);
        if (queryParams.select) {
            const guardFields = max > 0 ? ['jsonSizeBytes', 'workflowVersionId'] : [];
            if (Array.isArray(queryParams.select)) {
                for (const field of ['id', 'workflowId', 'storedAt', ...guardFields]) {
                    if (!queryParams.select.includes(field))
                        queryParams.select.push(field);
                }
            }
            else {
                queryParams.select.id = true;
                queryParams.select.workflowId = true;
                queryParams.select.storedAt = true;
                for (const field of guardFields)
                    queryParams.select[field] = true;
            }
        }
        const entities = await this.executionRepository.find(queryParams);
        if (entities.length === 0)
            return { executions: [], unreadableIds: [] };
        const assembledById = new Map();
        const entitiesToRead = await this.skipOversizedEntities(entities, max, assembledById);
        const entitiesByLocation = new Map();
        for (const entity of entitiesToRead) {
            const group = entitiesByLocation.get(entity.storedAt) ?? [];
            group.push(entity);
            entitiesByLocation.set(entity.storedAt, group);
        }
        await Promise.all([...entitiesByLocation].map(async ([location, group]) => {
            const refs = group.map((e) => ({ workflowId: e.workflowId, executionId: e.id }));
            const start = Date.now();
            let success = false;
            let unreadableBundles = 0;
            try {
                const bundles = location === 'db'
                    ? await this.dbStore.readMany(refs)
                    : await this.jsonStore.readMany(refs.map((ref) => ({ ...ref, storedAt: location })));
                const missing = group.filter((e) => !bundles.has(e.id));
                if (missing.length > 0)
                    this.executionRepository.reportInvalidExecutions(missing);
                unreadableBundles = missing.length;
                const settled = await Promise.allSettled(group.map(async (entity) => {
                    const bundle = bundles.get(entity.id);
                    if (!bundle)
                        return;
                    assembledById.set(entity.id, await this.assembleReadExecution(entity, bundle, options, max));
                }));
                const corrupt = group.filter((_, i) => {
                    const outcome = settled[i];
                    return (outcome.status === 'rejected' && outcome.reason instanceof corrupted_execution_data_error_1.CorruptedExecutionDataError);
                });
                unreadableBundles += corrupt.length;
                if (corrupt.length > 0)
                    this.executionRepository.reportInvalidExecutions(corrupt);
                for (const outcome of settled) {
                    if (outcome.status === 'rejected' &&
                        !(outcome.reason instanceof corrupted_execution_data_error_1.CorruptedExecutionDataError)) {
                        throw outcome.reason;
                    }
                }
                success = true;
            }
            finally {
                this.eventService.emit('execution-data-read', {
                    mode: location,
                    durationMs: Date.now() - start,
                    success,
                    unreadableBundles,
                });
            }
        }));
        const executions = [];
        const unreadableIds = [];
        for (const entity of entities) {
            const assembled = assembledById.get(entity.id);
            if (assembled === undefined)
                unreadableIds.push(entity.id);
            else
                executions.push(assembled);
        }
        return {
            executions: executions,
            unreadableIds,
        };
    }
    async findWithUnflattenedData(executionId, accessibleWorkflowIds) {
        return await this.findSingleExecution(executionId, {
            where: { workflowId: (0, db_1.In)(accessibleWorkflowIds) },
            includeData: true,
            unflattenData: true,
            includeAnnotation: true,
        });
    }
    async findOneInWorkflows(executionId, workflowIds, options = {}) {
        const { includeData = true, includeAnnotation = true, maxDataSizeBytes } = options;
        return await this.findSingleExecution(executionId, {
            where: { workflowId: (0, db_1.In)(workflowIds) },
            includeData,
            unflattenData: true,
            includeAnnotation,
            maxDataSizeBytes,
        });
    }
    async findStatusesByIds(ids) {
        return await this.executionRepository.findStatusesByIds(ids);
    }
    async findManyInWorkflows(workflowIds, options, maxDataSizeBytes) {
        return await this.findMultipleExecutions({
            select: [
                'id',
                'mode',
                'retryOf',
                'retrySuccessId',
                'startedAt',
                'stoppedAt',
                'workflowId',
                'waitTill',
                'finished',
                'status',
            ],
            where: this.executionRepository.getFindManyInWorkflowsCondition(workflowIds, options),
            order: { id: 'DESC' },
            take: options.limit,
        }, { includeData: options.includeData, unflattenData: true, maxDataSizeBytes });
    }
    async deleteInFlightExecution(target) {
        if (this.executionsConfig.pruneData) {
            const bufferMs = this.executionsConfig.pruneDataHardDeleteBuffer * constants_1.Time.hours.toMilliseconds;
            const deletedAt = new Date(Date.now() - bufferMs);
            await this.executionRepository.update(target.executionId, { deletedAt });
        }
        else {
            await this.hardDelete(target);
        }
    }
    async hardDelete(target) {
        const targets = Array.isArray(target) ? target : [target];
        if (targets.length === 0)
            return;
        await Promise.all([
            this.binaryDataService.deleteMany(targets.map((t) => ({ type: 'execution', ...t }))),
            this.jsonStore.delete(this.toBlobRefs(targets)),
        ]);
        await this.executionRepository.deleteByIds(targets.map((t) => t.executionId));
    }
    async hardDeleteBy(criteria) {
        const refs = await this.executionRepository.deleteExecutionsByFilter(criteria);
        await this.jsonStore.delete(this.toBlobRefs(refs));
    }
    async hardDeleteByWorkflowId(workflowId) {
        const maxBatches = await this.maxBulkDeletionBatches();
        for (let batch = 0; batch < maxBatches; batch++) {
            const executions = await this.executionRepository.find({
                select: ['id', 'workflowId', 'storedAt'],
                where: { workflowId },
                take: ExecutionPersistence_1.bulkDeletionBatchSize,
                withDeleted: true,
            });
            if (executions.length === 0)
                return;
            await this.hardDelete(executions.map((execution) => ({
                executionId: execution.id,
                workflowId: execution.workflowId,
                storedAt: execution.storedAt,
            })));
        }
        const remaining = await this.executionRepository.find({
            select: ['id'],
            where: { workflowId },
            take: 1,
            withDeleted: true,
        });
        if (remaining.length === 0)
            return;
        throw new n8n_workflow_1.UnexpectedError(`Failed to delete all executions of workflow ${workflowId}: executions keep being added while deleting them - is the workflow still active?`);
    }
    async maxBulkDeletionBatches() {
        const { bulkDeletionBatchSize, maxBulkDeletionBatchesPerRun: fallback } = ExecutionPersistence_1;
        const estimate = await this.estimateExecutionsTableSize();
        if (estimate === null)
            return fallback;
        return Math.max(Math.ceil((estimate * 2) / bulkDeletionBatchSize), fallback);
    }
    async estimateExecutionsTableSize() {
        if (this.databaseConfig.type !== 'postgresdb')
            return null;
        try {
            const { schema, tableName } = this.executionRepository.metadata;
            const table = schema ? `"${schema}"."${tableName}"` : `"${tableName}"`;
            const rows = (await this.executionRepository.query('SELECT reltuples::bigint AS estimate FROM pg_class WHERE oid = to_regclass($1)', [table]));
            const estimate = Number(rows[0]?.estimate);
            return Number.isFinite(estimate) && estimate >= 0 ? estimate : null;
        }
        catch {
            return null;
        }
    }
    toBlobRefs(targets) {
        return targets.filter((t) => t.storedAt !== 'db');
    }
    async updateEntityOnly(executionId, execution, conditions) {
        const updatableColumns = this.pickUpdatableEntityColumns(execution);
        if (Object.keys(updatableColumns).length === 0)
            return true;
        const whereCondition = this.buildEntityWhereCondition(executionId, conditions);
        const result = await this.executionRepository.update(whereCondition, updatableColumns);
        return (result.affected ?? 0) > 0;
    }
    async applyDataUpdate(ref, mode, workflowVersionId, execution, conditions) {
        const { data, workflowData } = execution;
        const updatableColumns = this.pickUpdatableEntityColumns(execution);
        const isFullOverwrite = data !== undefined &&
            workflowData !== undefined &&
            (workflowVersionId !== null || mode === 'db');
        return await this.executionRepository.manager.transaction(async (tx) => {
            const whereCondition = this.buildEntityWhereCondition(ref.executionId, conditions);
            if (Object.keys(updatableColumns).length > 0) {
                const result = await tx.update(db_1.ExecutionEntity, whereCondition, updatableColumns);
                if ((result.affected ?? 0) === 0)
                    return false;
            }
            else if (conditions) {
                const lock = this.databaseConfig.type === 'postgresdb'
                    ? { mode: 'pessimistic_write' }
                    : undefined;
                const matchingRow = await tx.findOne(db_1.ExecutionEntity, {
                    where: whereCondition,
                    select: ['id'],
                    lock,
                });
                if (!matchingRow)
                    return false;
            }
            if (isFullOverwrite) {
                const binaryDataSizeBytes = (0, sum_binary_data_bytes_1.sumBinaryDataBytes)(data);
                const jsonSizeBytes = await this.trackWrite(mode, ref.workflowId, async () => {
                    const bundle = {
                        data: (0, flatted_1.stringify)(data),
                        workflowData: (0, types_1.toWorkflowSnapshot)(workflowData),
                        workflowVersionId,
                    };
                    return mode === 'db'
                        ? await this.dbStore.overwrite(ref, bundle, tx)
                        : await this.jsonStore.write(ref, bundle, mode);
                });
                await tx.update(db_1.ExecutionEntity, { id: ref.executionId }, { jsonSizeBytes, binaryDataSizeBytes });
                return true;
            }
            const stored = await this.trackRead(mode, async () => data !== undefined && mode === 'db'
                ? await this.dbStore.readWorkflowData(ref, tx)
                : await this.readData(mode, ref, tx));
            if (!stored)
                throw new missing_execution_data_error_1.MissingExecutionDataError(ref);
            const jsonSizeBytes = await this.trackWrite(mode, ref.workflowId, async () => {
                let serializedData;
                if (data !== undefined) {
                    serializedData = (0, flatted_1.stringify)(data);
                }
                else if ((0, types_1.isExecutionDataPayload)(stored)) {
                    serializedData = stored.data;
                }
                else {
                    throw new unreadable_run_data_error_1.UnreadableRunDataError(ref);
                }
                const bundle = {
                    data: serializedData,
                    workflowData: workflowData ? (0, types_1.toWorkflowSnapshot)(workflowData) : stored.workflowData,
                    workflowVersionId: stored.workflowVersionId,
                };
                return await this.writeData(mode, ref, bundle, tx);
            });
            const sizeColumns = data !== undefined
                ? { jsonSizeBytes, binaryDataSizeBytes: (0, sum_binary_data_bytes_1.sumBinaryDataBytes)(data) }
                : { jsonSizeBytes };
            await tx.update(db_1.ExecutionEntity, { id: ref.executionId }, sizeColumns);
            return true;
        });
    }
    pickUpdatableEntityColumns(execution) {
        const { id: _id, data: _data, workflowId: _workflowId, workflowData: _workflowData, workflowVersionId: _workflowVersionId, createdAt: _createdAt, startedAt: _startedAt, customData: _customData, jsonSizeBytes: _jsonSizeBytes, binaryDataSizeBytes: _binaryDataSizeBytes, ...updatableColumns } = execution;
        return updatableColumns;
    }
    buildEntityWhereCondition(executionId, conditions) {
        if (conditions?.requireStatus && conditions?.requireNotCanceled) {
            throw new n8n_workflow_1.UnexpectedError('`requireStatus` and `requireNotCanceled` cannot be combined');
        }
        const where = { id: executionId };
        if (conditions?.requireStatus)
            where.status = conditions.requireStatus;
        if (conditions?.requireNotFinished)
            where.finished = false;
        if (conditions?.requireNotCanceled)
            where.status = (0, db_1.Not)('canceled');
        return where;
    }
    async trackRead(mode, op) {
        const start = Date.now();
        let success = false;
        let unreadableBundles = 0;
        try {
            const result = await op();
            success = result !== null && result !== undefined;
            if (!success)
                unreadableBundles = 1;
            return result;
        }
        catch (error) {
            if (error instanceof corrupted_execution_data_error_1.CorruptedExecutionDataError)
                unreadableBundles = 1;
            throw error;
        }
        finally {
            this.eventService.emit('execution-data-read', {
                mode,
                durationMs: Date.now() - start,
                success,
                unreadableBundles,
            });
        }
    }
    async trackWrite(mode, workflowId, op) {
        const start = Date.now();
        let success = false;
        let jsonSizeBytes = 0;
        try {
            jsonSizeBytes = await op();
            success = true;
            return jsonSizeBytes;
        }
        finally {
            this.eventService.emit('execution-data-write', {
                mode,
                workflowId,
                durationMs: Date.now() - start,
                success,
                jsonSizeBytes,
            });
        }
    }
    async writeData(mode, ref, payload, tx) {
        return mode === 'db'
            ? await this.dbStore.write(ref, payload, tx)
            : await this.jsonStore.write(ref, payload, mode);
    }
    async readData(mode, ref, tx) {
        if (mode !== 'db')
            return await this.jsonStore.read(ref, mode);
        return tx ? await this.dbStore.read(ref, tx) : await this.dbStore.read(ref);
    }
    async assembleExecution(entity, bundle, options) {
        const { metadata, annotation, ...rest } = entity;
        const ref = { workflowId: entity.workflowId, executionId: entity.id };
        const data = await this.parseExecutionData(ref, bundle.data, options);
        const serializedAnnotation = this.serializeAnnotation(annotation);
        if (entity.status === 'success' && bundle.data === '[]') {
            this.errorReporter.error('Found successful execution where data is empty stringified array', {
                extra: { executionId: entity.id, workflowId: bundle.workflowData.id },
            });
        }
        return {
            ...rest,
            data,
            workflowData: bundle.workflowData,
            workflowVersionId: bundle.workflowVersionId ?? null,
            customData: Object.fromEntries(metadata.map((m) => [m.key, m.value])),
            ...(options.includeAnnotation && serializedAnnotation
                ? { annotation: serializedAnnotation }
                : {}),
        };
    }
    maxDisplayDataSize(options) {
        return options.unflattenData ? (options.maxDataSizeBytes ?? 0) : 0;
    }
    isKnownOversize(entity, max) {
        return max > 0 && entity.jsonSizeBytes > 0 && entity.jsonSizeBytes > max;
    }
    async assembleSkippedExecution(entity, ref, options) {
        const snapshot = entity.storedAt === 'db'
            ? ((await this.dbStore.readWorkflowData(ref)) ?? undefined)
            : undefined;
        return this.assembleOversizedExecution(entity, { includeAnnotation: options.includeAnnotation }, snapshot);
    }
    assembleOversizedExecution(entity, options, snapshot) {
        const { metadata, annotation, ...rest } = entity;
        const serializedAnnotation = this.serializeAnnotation(annotation);
        const workflowData = snapshot?.workflowData ?? {
            id: entity.workflowId,
            name: '',
            nodes: [],
            connections: {},
            settings: {},
        };
        return {
            ...rest,
            data: (0, n8n_workflow_1.createEmptyRunExecutionData)(),
            workflowData,
            workflowVersionId: snapshot?.workflowVersionId ?? entity.workflowVersionId ?? null,
            customData: Object.fromEntries(metadata.map((m) => [m.key, m.value])),
            dataTooLargeToDisplay: true,
            ...(options.includeAnnotation && serializedAnnotation
                ? { annotation: serializedAnnotation }
                : {}),
        };
    }
    async skipOversizedEntities(entities, max, assembledById) {
        if (max <= 0)
            return entities;
        const entitiesToRead = [];
        const oversized = [];
        for (const entity of entities) {
            if (this.isKnownOversize(entity, max))
                oversized.push(entity);
            else
                entitiesToRead.push(entity);
        }
        await Promise.all(oversized.map(async (entity) => {
            const ref = { workflowId: entity.workflowId, executionId: entity.id };
            assembledById.set(entity.id, await this.assembleSkippedExecution(entity, ref, {}));
        }));
        return entitiesToRead;
    }
    async assembleReadExecution(entity, bundle, options, max) {
        if (max > 0 && entity.jsonSizeBytes === 0 && Buffer.byteLength(bundle.data, 'utf8') > max) {
            return this.assembleOversizedExecution(entity, { includeAnnotation: options.includeAnnotation }, { workflowData: bundle.workflowData, workflowVersionId: bundle.workflowVersionId });
        }
        return await this.assembleExecution(entity, bundle, options);
    }
    async parseExecutionData(ref, data, options) {
        if (!options.unflattenData)
            return data;
        try {
            const deserialized = await (0, backend_common_1.parseFlatted)(data);
            if (!deserialized)
                return undefined;
            return (0, n8n_workflow_1.migrateRunExecutionData)(deserialized);
        }
        catch (error) {
            throw new corrupted_execution_data_error_1.CorruptedExecutionDataError(ref, error);
        }
    }
    serializeAnnotation(annotation) {
        if (!annotation)
            return null;
        const { id, vote, tags } = annotation;
        return {
            id,
            vote,
            tags: tags?.map(({ id, name }) => ({ id, name })) ?? [],
        };
    }
    isDuplicateExecutionError(error) {
        if (!(error instanceof Error) || !('driverError' in error))
            return false;
        const { driverError } = error;
        if (typeof driverError !== 'object' || driverError === null || !('code' in driverError)) {
            return false;
        }
        const { code } = driverError;
        if (typeof code !== 'string')
            return false;
        if (!error.message.includes('deduplicationKey'))
            return false;
        if (this.databaseConfig.type === 'postgresdb') {
            return code === '23505';
        }
        return (code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            (code === 'SQLITE_CONSTRAINT' && error.message.includes('UNIQUE constraint failed')));
    }
};
exports.ExecutionPersistence = ExecutionPersistence;
ExecutionPersistence.bulkDeletionBatchSize = 500;
ExecutionPersistence.maxBulkDeletionBatchesPerRun = 20_000;
exports.ExecutionPersistence = ExecutionPersistence = ExecutionPersistence_1 = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [db_1.ExecutionRepository, n8n_core_1.BinaryDataService, execution_data_json_store_1.ExecutionDataJsonStore, db_store_1.DbStore, n8n_core_1.StorageConfig, config_1.ExecutionsConfig, config_1.DatabaseConfig, n8n_core_1.ErrorReporter, backend_services_1.EventService])
], ExecutionPersistence);
//# sourceMappingURL=execution-persistence.js.map