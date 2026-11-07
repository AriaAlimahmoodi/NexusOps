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
exports.ImportService = void 0;
const backend_common_1 = require("@n8n/backend-common");
const db_1 = require("@n8n/db");
const di_1 = require("@n8n/di");
const typeorm_1 = require("@n8n/typeorm");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const ensure_error_1 = require("@n8n/utils/errors/ensure-error");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const data_table_ddl_service_1 = require("../modules/data-table/data-table-ddl.service");
const sql_utils_1 = require("../modules/data-table/utils/sql-utils");
const workflow_index_service_1 = require("../modules/workflow-index/workflow-index.service");
const policy_enforcement_service_1 = require("../policy/policy-enforcement.service");
const policy_violation_error_1 = require("../policy/policy-violation.error");
const compression_util_1 = require("../utils/compression.util");
const validate_database_type_1 = require("../utils/validate-database-type");
const workflow_helpers_1 = require("../workflow-helpers");
const deprecated_nodes_validation_service_1 = require("../workflows/deprecated-nodes-validation.service");
const workflow_service_1 = require("../workflows/workflow.service");
const data_table_export_constants_1 = require("./data-table-export.constants");
let ImportService = class ImportService {
    constructor(logger, credentialsRepository, tagRepository, dataSource, cipher, workflowIndexService, dataTableDDLService, userRepository, workflowService, policyEnforcementService, sharedWorkflowRepository, workflowRepository, deprecatedNodesValidationService) {
        this.logger = logger;
        this.credentialsRepository = credentialsRepository;
        this.tagRepository = tagRepository;
        this.dataSource = dataSource;
        this.cipher = cipher;
        this.workflowIndexService = workflowIndexService;
        this.dataTableDDLService = dataTableDDLService;
        this.userRepository = userRepository;
        this.workflowService = workflowService;
        this.policyEnforcementService = policyEnforcementService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.deprecatedNodesValidationService = deprecatedNodesValidationService;
        this.dbCredentials = [];
        this.dbTags = [];
        this.foreignKeyCommands = {
            disable: {
                sqlite: 'PRAGMA defer_foreign_keys = ON;',
                'sqlite-pooled': 'PRAGMA defer_foreign_keys = ON;',
                'sqlite-memory': 'PRAGMA defer_foreign_keys = ON;',
                postgres: 'SET session_replication_role = replica;',
                postgresql: 'SET session_replication_role = replica;',
            },
            enable: {
                sqlite: 'PRAGMA defer_foreign_keys = OFF;',
                'sqlite-pooled': 'PRAGMA defer_foreign_keys = OFF;',
                'sqlite-memory': 'PRAGMA defer_foreign_keys = OFF;',
                postgres: 'SET session_replication_role = ORIGIN;',
                postgresql: 'SET session_replication_role = ORIGIN;',
            },
        };
    }
    async initRecords() {
        this.dbCredentials = await this.credentialsRepository.find({
            where: { usageScope: 'project' },
        });
        this.dbTags = await this.tagRepository.find();
    }
    async importWorkflows(workflows, projectId, userId, { activeState = 'false' }) {
        await this.initRecords();
        const user = await this.userRepository.findOneOrFail({
            where: { id: userId },
            relations: ['role'],
        });
        const { manager: dbManager } = this.credentialsRepository;
        const workflowIds = workflows.map((w) => w.id).filter((id) => !!id);
        const existingWorkflowIds = new Set();
        const activeVersionIdByWorkflow = new Map();
        const existingNodesByWorkflow = new Map();
        let existingOwnerProjects = new Map();
        if (workflowIds.length > 0) {
            const existingWorkflows = await dbManager.find(db_1.WorkflowEntity, {
                where: { id: (0, typeorm_1.In)(workflowIds) },
                select: ['id', 'activeVersionId', 'nodes'],
            });
            for (const { id, activeVersionId, nodes } of existingWorkflows) {
                existingWorkflowIds.add(id);
                if (activeVersionId !== null) {
                    activeVersionIdByWorkflow.set(id, activeVersionId);
                }
                existingNodesByWorkflow.set(id, nodes ?? []);
            }
            if (this.policyEnforcementService.hasChecksFor('contentImport')) {
                existingOwnerProjects =
                    await this.sharedWorkflowRepository.findOwnerProjectsByWorkflowIds(workflowIds);
            }
        }
        const violations = [];
        const admitted = [];
        for (const workflow of workflows) {
            workflow.nodes.forEach((node) => {
                this.toNewCredentialFormat(node);
                if (!node.id)
                    node.id = (0, uuid_1.v4)();
            });
            const hasInvalidCreds = workflow.nodes.some((node) => !node.credentials?.id);
            if (hasInvalidCreds)
                await this.replaceInvalidCreds(workflow, projectId);
            (0, workflow_helpers_1.validateWorkflowStructure)(workflow);
            const existingNodes = workflow.id ? existingNodesByWorkflow.get(workflow.id) : undefined;
            if (existingNodes) {
                this.deprecatedNodesValidationService.validateOnUpdate(workflow.nodes, existingNodes, workflow.id);
            }
            else {
                this.deprecatedNodesValidationService.validateOnCreate(workflow.nodes, workflow.id);
            }
            for (const warning of (0, workflow_helpers_1.sanitizeNodeGroupDescriptions)(workflow)) {
                this.logger.warn(`Workflow "${workflow.name}": ${warning}`);
            }
            const policyProjectId = workflow.id
                ? (existingOwnerProjects.get(workflow.id)?.id ?? projectId)
                : projectId;
            let cleared;
            try {
                cleared = await this.policyEnforcementService.enforceContentImport({
                    workflow: { id: workflow.id ?? null, name: workflow.name, nodes: workflow.nodes },
                    projectId: policyProjectId,
                    transport: 'cli',
                }, { kind: 'system', reason: 'cli-import' });
            }
            catch (error) {
                if (!(error instanceof policy_violation_error_1.PolicyViolationError))
                    throw error;
                violations.push({
                    workflowId: workflow.id ?? null,
                    name: workflow.name,
                    violations: error.violations,
                });
                continue;
            }
            admitted.push({ workflow, cleared });
        }
        for (const { workflow } of admitted) {
            if (workflow.id && activeVersionIdByWorkflow.has(workflow.id)) {
                await this.workflowService.deactivateWorkflow(user, workflow.id, { source: 'import' });
            }
        }
        const insertedWorkflows = [];
        const workflowsToActivate = [];
        await this.workflowRepository.runInTransaction({}, async (tx, ctx) => {
            for (const { workflow, cleared } of admitted) {
                workflow.versionId = (0, uuid_1.v4)();
                const oldActiveVersionId = workflow.id ? activeVersionIdByWorkflow.get(workflow.id) : null;
                const shouldActivate = activeState === 'fromJson' && workflow.active;
                const versionIdToActivate = workflow.versionId;
                if (!shouldActivate &&
                    (oldActiveVersionId || workflow.activeVersionId || workflow.active)) {
                    this.logger.info(`Deactivating workflow "${workflow.name}".`);
                }
                workflow.active = false;
                workflow.activeVersionId = null;
                const workflowId = await this.workflowRepository.upsertImportedContent(workflow, {
                    ...ctx,
                    policyCleared: cleared,
                });
                insertedWorkflows.push({ ...workflow, id: workflowId });
                if (shouldActivate) {
                    workflowsToActivate.push({ workflowId, versionId: versionIdToActivate });
                }
                const personalProject = await tx.findOneByOrFail(db_1.Project, { id: projectId });
                if (!existingWorkflowIds.has(workflow.id)) {
                    await tx.upsert(db_1.SharedWorkflow, { workflowId, projectId: personalProject.id, role: 'workflow:owner' }, ['workflowId', 'projectId']);
                }
                if (!workflow.tags?.length)
                    continue;
                await this.tagRepository.setTags(tx, this.dbTags, workflow);
                for (const tag of workflow.tags) {
                    await tx.upsert(db_1.WorkflowTagMapping, { tagId: tag.id, workflowId }, [
                        'tagId',
                        'workflowId',
                    ]);
                }
            }
            for (const workflow of insertedWorkflows) {
                const versionMetadata = workflow.versionMetadata;
                await tx.insert(db_1.WorkflowHistory, {
                    versionId: workflow.versionId,
                    workflowId: workflow.id,
                    nodes: workflow.nodes,
                    connections: workflow.connections,
                    nodeGroups: workflow.nodeGroups,
                    authors: 'import',
                    name: versionMetadata?.name ?? null,
                    description: versionMetadata?.description ?? null,
                });
            }
        });
        const orderedWorkflowsToActivate = this.sortWorkflowsForActivation(insertedWorkflows, workflowsToActivate);
        for (const { workflowId, versionId } of orderedWorkflowsToActivate) {
            await this.activateWorkflow(workflowId, versionId, user);
        }
        for (const workflow of insertedWorkflows) {
            await this.workflowIndexService.updateIndexForDraft(workflow);
        }
        return { violations };
    }
    sortWorkflowsForActivation(allImportedWorkflows, toActivate) {
        if (toActivate.length <= 1)
            return toActivate;
        const nodesByWorkflowId = new Map(allImportedWorkflows.map((w) => [w.id, w.nodes]));
        const activateIds = new Set(toActivate.map((w) => w.workflowId));
        const hasCrossReference = toActivate.some(({ workflowId }) => (nodesByWorkflowId.get(workflowId) ?? []).some((node) => !node.disabled &&
            node.type === 'n8n-nodes-base.executeWorkflow' &&
            activateIds.has(this.extractSubworkflowId(node) ?? '')));
        if (!hasCrossReference)
            return toActivate;
        const toActivateByWorkflowId = new Map(toActivate.map((w) => [w.workflowId, w]));
        const dependents = new Map(toActivate.map(({ workflowId }) => [workflowId, new Set()]));
        const unresolvedDepsCount = new Map(toActivate.map(({ workflowId }) => [workflowId, 0]));
        for (const { workflowId } of toActivate) {
            for (const node of nodesByWorkflowId.get(workflowId) ?? []) {
                if (node.disabled || node.type !== 'n8n-nodes-base.executeWorkflow')
                    continue;
                const calleeId = this.extractSubworkflowId(node);
                if (!calleeId || !activateIds.has(calleeId) || calleeId === workflowId)
                    continue;
                dependents.get(calleeId).add(workflowId);
                unresolvedDepsCount.set(workflowId, unresolvedDepsCount.get(workflowId) + 1);
            }
        }
        const queue = toActivate.filter((w) => unresolvedDepsCount.get(w.workflowId) === 0);
        const result = [];
        while (queue.length > 0) {
            const item = queue.shift();
            result.push(item);
            for (const callerId of dependents.get(item.workflowId)) {
                const remaining = unresolvedDepsCount.get(callerId) - 1;
                unresolvedDepsCount.set(callerId, remaining);
                if (remaining === 0)
                    queue.push(toActivateByWorkflowId.get(callerId));
            }
        }
        if (result.length < toActivate.length) {
            const cycleWorkflows = toActivate.filter((w) => Number(unresolvedDepsCount.get(w.workflowId)) > 0);
            this.logger.warn(`Detected circular subworkflow references among workflows: [${cycleWorkflows.map((w) => w.workflowId).join(', ')}]. Activating them in original order.`);
            result.push(...cycleWorkflows);
        }
        return result;
    }
    extractSubworkflowId(node) {
        const source = node.parameters?.['source'];
        if (source === 'parameter' || source === 'localFile' || source === 'url')
            return undefined;
        const wfId = node.parameters?.['workflowId'];
        const rawId = typeof wfId === 'string' ? wfId : wfId?.value;
        return typeof rawId === 'string' && !rawId.startsWith('=') ? rawId : undefined;
    }
    async activateWorkflow(workflowId, versionIdToActivate, user) {
        try {
            await this.workflowService.activateWorkflow(user, workflowId, {
                versionId: versionIdToActivate,
                source: 'import',
            });
        }
        catch (e) {
            this.logger.error(`Failed to activate workflow ${workflowId}`, { error: (0, ensure_error_1.ensureError)(e) });
        }
    }
    async replaceInvalidCreds(workflow, projectId) {
        try {
            await (0, workflow_helpers_1.replaceInvalidCredentials)(workflow, projectId);
        }
        catch (e) {
            this.logger.error('Failed to replace invalid credential', { error: e });
        }
    }
    async isTableEmpty(tableName) {
        try {
            const result = await this.dataSource
                .createQueryBuilder()
                .select('1')
                .from(tableName, tableName)
                .limit(1)
                .getRawMany();
            this.logger.debug(`Table ${tableName} has ${result.length} rows`);
            return result.length === 0;
        }
        catch (error) {
            this.logger.error(`Failed to check if table ${tableName} is empty:`, { error });
            throw new Error(`Unable to check table ${tableName}`);
        }
    }
    async areAllEntityTablesEmpty(tableNames) {
        if (tableNames.length === 0) {
            this.logger.info('No table names provided, considering all tables empty');
            return true;
        }
        this.logger.info(`Checking if ${tableNames.length} tables are empty...`);
        const nonEmptyTables = [];
        for (const tableName of tableNames) {
            const isEmpty = await this.isTableEmpty(tableName);
            if (!isEmpty) {
                nonEmptyTables.push(tableName);
            }
        }
        if (nonEmptyTables.length > 0) {
            this.logger.info(`📊 Found ${nonEmptyTables.length} table(s) with existing data: ${nonEmptyTables.join(', ')}`);
            return false;
        }
        this.logger.info('✅ All tables are empty');
        return true;
    }
    async truncateEntityTable(tableName, transactionManager) {
        this.logger.info(`🗑️  Truncating table: ${tableName}`);
        await transactionManager.createQueryBuilder().delete().from(tableName, tableName).execute();
        this.logger.info(`   ✅ Table ${tableName} truncated successfully`);
    }
    async getImportMetadata(inputDir) {
        const files = await (0, promises_1.readdir)(inputDir);
        const entityTableNamesMap = {};
        const entityFiles = {};
        const dataTableFiles = {};
        for (const file of files) {
            if (!file.endsWith('.jsonl'))
                continue;
            const baseName = file.replace(/\.\d+\.jsonl$/, '.jsonl').replace('.jsonl', '');
            if (baseName === 'migrations') {
                continue;
            }
            if (baseName.startsWith(data_table_export_constants_1.DATA_TABLE_ROWS_FILE_PREFIX)) {
                const dataTableId = baseName.slice(data_table_export_constants_1.DATA_TABLE_ROWS_FILE_PREFIX.length);
                if (!dataTableFiles[dataTableId])
                    dataTableFiles[dataTableId] = [];
                dataTableFiles[dataTableId].push((0, backend_common_1.safeJoinPath)(inputDir, file));
                continue;
            }
            const entityName = baseName;
            if (!entityTableNamesMap[entityName]) {
                const entityMetadata = this.dataSource.entityMetadatas.find((meta) => meta.name.toLowerCase() === entityName);
                if (!entityMetadata) {
                    this.logger.warn(`⚠️  No entity metadata found for ${entityName}, skipping...`);
                    continue;
                }
                entityTableNamesMap[entityName] = entityMetadata.tableName;
            }
            if (!entityFiles[entityName]) {
                entityFiles[entityName] = [];
            }
            entityFiles[entityName].push((0, backend_common_1.safeJoinPath)(inputDir, file));
        }
        return {
            tableNames: Object.values(entityTableNamesMap),
            entityFiles,
            dataTableFiles,
        };
    }
    async readEntityFile(filePath, customEncryptionKey) {
        const content = await (0, promises_1.readFile)(filePath, 'utf8');
        const entities = [];
        const entitySchema = zod_1.z.record(zod_1.z.string(), zod_1.z.unknown());
        for (const block of content.split('\n')) {
            const lines = (await this.cipher.decryptV2(block, customEncryptionKey)).split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line)
                    continue;
                try {
                    entities.push(entitySchema.parse(JSON.parse(line)));
                }
                catch (error) {
                    this.logger.error(`Failed to parse JSON on line ${i + 1} in ${filePath}`, { error });
                    this.logger.error(`Line content (first 200 chars): ${line.substring(0, 200)}...`);
                    throw new Error(`Invalid JSON on line ${i + 1} in file ${filePath}. JSONL format requires one complete JSON object per line.`);
                }
            }
        }
        return entities;
    }
    async decompressEntitiesZip(inputDir) {
        const entitiesZipPath = (0, backend_common_1.safeJoinPath)(inputDir, 'entities.zip');
        const { existsSync } = await import('fs');
        if (!existsSync(entitiesZipPath)) {
            throw new Error(`entities.zip file not found in ${inputDir}.`);
        }
        this.logger.info(`\n🗜️  Found entities.zip file, decompressing to ${inputDir}...`);
        await (0, compression_util_1.decompressFolder)(entitiesZipPath, inputDir);
        this.logger.info('✅ Successfully decompressed entities.zip');
    }
    async importEntities(inputDir, truncateTables, keyFilePath, skipMigrationChecks = false, skipTogglingForeignKeyConstraints = false) {
        (0, validate_database_type_1.validateDbTypeForImportEntities)(this.dataSource.options.type);
        let customEncryptionKey;
        if (keyFilePath) {
            try {
                const keyFileContent = await (0, promises_1.readFile)(keyFilePath, 'utf8');
                customEncryptionKey = keyFileContent.trim();
                this.logger.info(`🔑 Using custom encryption key from: ${keyFilePath}`);
            }
            catch (error) {
                throw new Error(`Failed to read encryption key file at ${keyFilePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        await this.decompressEntitiesZip(inputDir);
        if (!skipMigrationChecks) {
            await this.validateMigrations(inputDir, customEncryptionKey);
        }
        else {
            this.logger.info('⏭️  Skipping migration validation checks');
        }
        await this.dataSource.transaction(async (transactionManager) => {
            if (!skipTogglingForeignKeyConstraints) {
                await this.disableForeignKeyConstraints(transactionManager);
            }
            const importMetadata = await this.getImportMetadata(inputDir);
            const { tableNames, entityFiles, dataTableFiles } = importMetadata;
            const entityNames = Object.keys(entityFiles);
            if (truncateTables) {
                this.logger.info('\n🗑️  Truncating tables before import...');
                await this.dropExistingDataTableUserTables(transactionManager);
                this.logger.info(`Found ${tableNames.length} tables to truncate: ${tableNames.join(', ')}`);
                await Promise.all(tableNames.map(async (tableName) => await this.truncateEntityTable(tableName, transactionManager)));
                this.logger.info('✅ All tables truncated successfully');
            }
            if (!truncateTables && !(await this.areAllEntityTablesEmpty(tableNames))) {
                this.logger.info('\n🗑️  Not all tables are empty, skipping import, you can use --truncateTables to truncate tables before import if needed');
                return;
            }
            await this.importEntitiesFromFiles(inputDir, transactionManager, entityNames, entityFiles, customEncryptionKey);
            await this.advanceIdentitySequences(transactionManager, tableNames);
            await this.recreateDataTableUserTablesFromRegistry(transactionManager, dataTableFiles, customEncryptionKey);
            if (!skipTogglingForeignKeyConstraints) {
                await this.enableForeignKeyConstraints(transactionManager);
            }
        });
        const { readdir, rm } = await import('fs/promises');
        const files = await readdir(inputDir);
        for (const file of files) {
            if (file.endsWith('.jsonl') && file !== 'entities.zip') {
                await rm((0, backend_common_1.safeJoinPath)(inputDir, file));
                this.logger.info(`   Removed: ${file}`);
            }
        }
        this.logger.info(`\n🗑️  Cleaned up decompressed files in ${inputDir}`);
    }
    async importEntitiesFromFiles(inputDir, transactionManager, entityNames, entityFiles, customEncryptionKey) {
        this.logger.info(`\n🚀 Starting entity import from directory: ${inputDir}`);
        if (entityNames.length === 0) {
            this.logger.warn('No entity files found in input directory');
            return;
        }
        this.logger.info(`📋 Found ${entityNames.length} entity types to import:`);
        let totalEntitiesImported = 0;
        await Promise.all(entityNames.map(async (entityName) => {
            const files = entityFiles[entityName];
            this.logger.info(`   • ${entityName}: ${files.length} file(s)`);
            this.logger.info(`\n📊 Importing ${entityName} entities...`);
            const entityMetadata = this.dataSource.entityMetadatas.find((meta) => meta.name.toLowerCase() === entityName);
            if (!entityMetadata) {
                this.logger.warn(`   ⚠️  No entity metadata found for ${entityName}, skipping...`);
                return;
            }
            const tableName = this.dataSource.driver.escape(entityMetadata.tableName);
            this.logger.info(`   📋 Target table: ${tableName}`);
            let entityCount = 0;
            await Promise.all(files.map(async (filePath) => {
                this.logger.info(`   📁 Reading file: ${filePath}`);
                const entities = await this.readEntityFile(filePath, customEncryptionKey);
                this.logger.info(`      Found ${entities.length} entities`);
                await Promise.all(entities.map(async (entity) => {
                    const normalizedEntity = this.normalizeEntityJsonColumns(entity, entityMetadata);
                    const columns = Object.keys(normalizedEntity);
                    const columnNames = columns.map(this.dataSource.driver.escape).join(', ');
                    const columnValues = columns.map((key) => `:${key}`).join(', ');
                    const [query, parameters] = this.dataSource.driver.escapeQueryWithParameters(`INSERT INTO ${tableName} (${columnNames}) VALUES (${columnValues})`, normalizedEntity, {});
                    await transactionManager.query(query, parameters);
                }));
                entityCount += entities.length;
            }));
            this.logger.info(`   ✅ Completed ${entityName}: ${entityCount} entities imported`);
            totalEntitiesImported += entityCount;
        }));
        this.logger.info('\n📊 Import Summary:');
        this.logger.info(`   Total entities imported: ${totalEntitiesImported}`);
        this.logger.info(`   Entity types processed: ${entityNames.length}`);
        this.logger.info('✅ Import completed successfully!');
    }
    toNewCredentialFormat(node) {
        if (!node.credentials)
            return;
        for (const [type, name] of Object.entries(node.credentials)) {
            if (typeof name !== 'string')
                continue;
            const nodeCredential = { id: null, name };
            const match = this.dbCredentials.find((c) => c.name === name && c.type === type);
            if (match)
                nodeCredential.id = match.id;
            node.credentials[type] = nodeCredential;
        }
    }
    normalizeEntityJsonColumns(entity, metadata) {
        const result = { ...entity };
        for (const column of metadata.columns) {
            const { databaseName, type } = column;
            if (type !== 'json' && type !== 'simple-json')
                continue;
            const value = result[databaseName];
            if (value === null || value === undefined)
                continue;
            if (typeof value === 'string') {
                try {
                    result[databaseName] = JSON.stringify(JSON.parse(value));
                }
                catch {
                }
            }
            else if (typeof value === 'object') {
                result[databaseName] = JSON.stringify(value);
            }
        }
        return result;
    }
    async dropExistingDataTableUserTables(transactionManager) {
        const tablePrefix = this.dataSource.options.entityPrefix || '';
        const dataTableTableName = `${tablePrefix}data_table`;
        let existing;
        try {
            existing = await transactionManager.query(`SELECT id FROM ${this.dataSource.driver.escape(dataTableTableName)}`);
        }
        catch (error) {
            this.logger.info(`   ⚠️  ${dataTableTableName} registry not found, skipping dynamic-table cleanup...`, { error });
            return;
        }
        if (existing.length === 0)
            return;
        this.logger.info(`🗑️  Dropping ${existing.length} existing data-table backing table(s)...`);
        for (const { id } of existing) {
            await this.dataTableDDLService.dropTable(id, transactionManager);
        }
    }
    async recreateDataTableUserTablesFromRegistry(transactionManager, dataTableFiles = {}, customEncryptionKey) {
        const dbType = this.dataSource.options.type;
        const tablePrefix = this.dataSource.options.entityPrefix || '';
        const dataTableTableName = `${tablePrefix}data_table`;
        const dataTableColumnTableName = `${tablePrefix}data_table_column`;
        let dataTables;
        try {
            dataTables = await transactionManager.query(`SELECT id FROM ${this.dataSource.driver.escape(dataTableTableName)}`);
        }
        catch (error) {
            this.logger.info(`   ⚠️  ${dataTableTableName} registry not present; skipping data-table backing-table recreation.`, { error });
            return;
        }
        if (dataTables.length === 0) {
            if (Object.keys(dataTableFiles).length > 0) {
                this.logger.warn(`   ⚠️  Found ${Object.keys(dataTableFiles).length} data-table row file(s) in the archive but no entries in the data_table registry; skipping.`);
            }
            return;
        }
        const escapedColumnTable = this.dataSource.driver.escape(dataTableColumnTableName);
        const escapedDataTableId = this.dataSource.driver.escape('dataTableId');
        const escapedIndex = this.dataSource.driver.escape('index');
        const columnRows = await transactionManager.query(`SELECT id, ${escapedDataTableId}, name, type, ${escapedIndex} FROM ${escapedColumnTable}`);
        const columnsByDataTableId = new Map();
        for (const row of columnRows) {
            const list = columnsByDataTableId.get(row.dataTableId) ?? [];
            list.push(row);
            columnsByDataTableId.set(row.dataTableId, list);
        }
        this.logger.info(`\n📚 Recreating ${dataTables.length} data-table backing table(s)...`);
        let totalRowsImported = 0;
        for (const { id: dataTableId } of dataTables) {
            const userTable = (0, sql_utils_1.toTableName)(dataTableId);
            const cols = (columnsByDataTableId.get(dataTableId) ?? [])
                .slice()
                .sort((a, b) => a.index - b.index);
            await this.dataTableDDLService.dropTable(dataTableId, transactionManager);
            await this.dataTableDDLService.createTableWithColumns(dataTableId, cols, transactionManager);
            const files = dataTableFiles[dataTableId];
            if (!files || files.length === 0)
                continue;
            const columnTypeMap = new Map(cols.map((c) => [c.name, c.type]));
            columnTypeMap.set('createdAt', 'date');
            columnTypeMap.set('updatedAt', 'date');
            const escapedTable = (0, sql_utils_1.quoteIdentifier)(userTable, dbType);
            let rowsForTable = 0;
            for (const filePath of files) {
                const rows = await this.readEntityFile(filePath, customEncryptionKey);
                for (const row of rows) {
                    const normalizedRow = {};
                    for (const [key, value] of Object.entries(row)) {
                        normalizedRow[key] = (0, sql_utils_1.normalizeUserRowValueForDatabase)(value, columnTypeMap.get(key), dbType);
                    }
                    const columnNames = Object.keys(normalizedRow);
                    const escapedCols = columnNames.map((c) => (0, sql_utils_1.quoteIdentifier)(c, dbType)).join(', ');
                    const placeholders = columnNames.map((c) => `:${c}`).join(', ');
                    const [query, params] = this.dataSource.driver.escapeQueryWithParameters(`INSERT INTO ${escapedTable} (${escapedCols}) VALUES (${placeholders})`, normalizedRow, {});
                    await transactionManager.query(query, params);
                    rowsForTable++;
                }
            }
            if (rowsForTable > 0 && dbType === 'postgres') {
                await this.advanceIdentitySequences(transactionManager, [userTable]);
            }
            if (rowsForTable > 0) {
                this.logger.info(`   ✅ ${userTable}: ${rowsForTable} row(s) imported`);
            }
            totalRowsImported += rowsForTable;
        }
        this.logger.info(`✅ Recreated ${dataTables.length} data-table backing table(s); imported ${totalRowsImported} row(s)`);
    }
    async advanceIdentitySequences(transactionManager, tableNames) {
        if (this.dataSource.options.type !== 'postgres')
            return;
        if (tableNames.length === 0)
            return;
        this.logger.info('\n🔢 Advancing Postgres IDENTITY sequences...');
        let advanced = 0;
        for (const tableName of tableNames) {
            const identityColumns = await transactionManager.query(`SELECT column_name FROM information_schema.columns
					WHERE table_schema = current_schema()
						AND table_name = $1
						AND identity_generation IS NOT NULL`, [tableName]);
            if (identityColumns.length === 0)
                continue;
            const escapedTable = this.dataSource.driver.escape(tableName);
            for (const { column_name: columnName } of identityColumns) {
                const escapedCol = this.dataSource.driver.escape(columnName);
                await transactionManager.query(`SELECT setval(
						pg_get_serial_sequence($1, $2),
						COALESCE((SELECT MAX(${escapedCol}) FROM ${escapedTable}), 1),
						(SELECT MAX(${escapedCol}) FROM ${escapedTable}) IS NOT NULL
					)`, [escapedTable, columnName]);
                advanced++;
            }
        }
        this.logger.info(`✅ Advanced ${advanced} sequence(s) across ${tableNames.length} table(s)`);
    }
    async disableForeignKeyConstraints(transactionManager) {
        const disableCommand = this.foreignKeyCommands.disable[this.dataSource.options.type];
        if (!disableCommand) {
            throw new Error(`Unsupported database type: ${this.dataSource.options.type}. Supported types: sqlite, postgres`);
        }
        this.logger.debug(`Executing: ${disableCommand}`);
        await transactionManager.query(disableCommand);
        this.logger.info('✅ Foreign key constraints disabled');
    }
    async enableForeignKeyConstraints(transactionManager) {
        const enableCommand = this.foreignKeyCommands.enable[this.dataSource.options.type];
        if (!enableCommand) {
            throw new Error(`Unsupported database type: ${this.dataSource.options.type}. Supported types: sqlite, postgres`);
        }
        this.logger.debug(`Executing: ${enableCommand}`);
        await transactionManager.query(enableCommand);
        this.logger.info('✅ Foreign key constraints re-enabled');
    }
    async validateMigrations(inputDir, customEncryptionKey) {
        const migrationsFilePath = (0, backend_common_1.safeJoinPath)(inputDir, 'migrations.jsonl');
        try {
            await (0, promises_1.readFile)(migrationsFilePath, 'utf8');
        }
        catch (error) {
            throw new Error('Migrations file not found. Cannot proceed with import without migration validation.');
        }
        const migrationsFileContent = await (0, promises_1.readFile)(migrationsFilePath, 'utf8');
        const importMigrations = (await this.cipher.decryptV2(migrationsFileContent, customEncryptionKey))
            .trim()
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => {
            try {
                return JSON.parse(line);
            }
            catch (error) {
                throw new Error(`Invalid JSON in migrations file: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        });
        if (importMigrations.length === 0) {
            this.logger.info('No migrations found in import data');
            return;
        }
        const latestImportMigration = importMigrations.reduce((latest, current) => {
            const currentTimestamp = parseInt(String(current.timestamp || current.id || '0'));
            const latestTimestamp = parseInt(String(latest.timestamp || latest.id || '0'));
            return currentTimestamp > latestTimestamp ? current : latest;
        });
        this.logger.info(`Latest migration in import data: ${String(latestImportMigration.name)} (timestamp: ${String(latestImportMigration.timestamp || latestImportMigration.id)}, id: ${String(latestImportMigration.id)})`);
        const tablePrefix = this.dataSource.options.entityPrefix || '';
        const migrationsTableName = `${tablePrefix}migrations`;
        const dbMigrations = await this.dataSource.query(`SELECT * FROM ${this.dataSource.driver.escape(migrationsTableName)} ORDER BY timestamp DESC LIMIT 1`);
        if (dbMigrations.length === 0) {
            throw new Error('Target database has no migrations. Cannot import data from a different migration state.');
        }
        const latestDbMigration = dbMigrations[0];
        this.logger.info(`Latest migration in target database: ${latestDbMigration.name} (timestamp: ${latestDbMigration.timestamp}, id: ${latestDbMigration.id})`);
        const importTimestamp = parseInt(String(latestImportMigration.timestamp || latestImportMigration.id || '0'));
        const dbTimestamp = parseInt(String(latestDbMigration.timestamp || '0'));
        const importName = latestImportMigration.name;
        const dbName = latestDbMigration.name;
        if (importTimestamp !== dbTimestamp) {
            throw new Error(`Migration timestamp mismatch. Import data: ${String(importName)} (${String(importTimestamp)}) does not match target database ${String(dbName)} (${String(dbTimestamp)}). Cannot import data from different migration states.`);
        }
        if (importName !== dbName) {
            throw new Error(`Migration name mismatch. Import data: ${String(importName)} does not match target database ${String(dbName)}. Cannot import data from different migration states.`);
        }
        this.logger.info('✅ Migration validation passed - import data matches target database migration state');
    }
};
exports.ImportService = ImportService;
exports.ImportService = ImportService = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [backend_common_1.Logger, db_1.CredentialsRepository, db_1.TagRepository, typeorm_1.DataSource, n8n_core_1.Cipher, workflow_index_service_1.WorkflowIndexService, data_table_ddl_service_1.DataTableDDLService, db_1.UserRepository, workflow_service_1.WorkflowService, policy_enforcement_service_1.PolicyEnforcementService, db_1.SharedWorkflowRepository, db_1.WorkflowRepository, deprecated_nodes_validation_service_1.DeprecatedNodesValidationService])
], ImportService);
//# sourceMappingURL=import.service.js.map