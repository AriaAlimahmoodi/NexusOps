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
exports.DataTableImporter = void 0;
const backend_common_1 = require("@n8n/backend-common");
const di_1 = require("@n8n/di");
const n8n_workflow_1 = require("n8n-workflow");
const errors_1 = require("@n8n/errors");
const data_table_service_1 = require("../../../../modules/data-table/data-table.service");
const pair_columns_1 = require("../../../../modules/data-table/utils/pair-columns");
const check_access_1 = require("../../../../permissions.ee/check-access");
const data_table_compat_1 = require("./data-table-compat");
const data_table_matching_mode_1 = require("./data-table-matching-mode");
const data_table_missing_mode_1 = require("./data-table-missing-mode");
const data_table_schema_conflict_policy_1 = require("./data-table-schema-conflict-policy");
const data_table_types_1 = require("./data-table.types");
const n8n_packages_types_1 = require("../../n8n-packages.types");
let DataTableImporter = class DataTableImporter {
    constructor(dataTableService, moduleRegistry) {
        this.dataTableService = dataTableService;
        this.moduleRegistry = moduleRegistry;
    }
    async plan(context, request) {
        const requirements = request.requirements ?? [];
        if (requirements.length === 0) {
            return { creations: [], updates: [], columnAlignments: [], failures: [], matchedCount: 0 };
        }
        if (!this.moduleRegistry.isActive('data-table')) {
            return {
                creations: [],
                updates: [],
                columnAlignments: [],
                failures: [{ kind: 'module-disabled' }],
                matchedCount: 0,
            };
        }
        const packageTablesById = new Map(request.packageDataTables.map((table) => [table.id, normalizeColumnIndexes(table)]));
        const targets = await this.dataTableService.findDataTablesByIds(requirements.map(({ id }) => id));
        const targetsById = new Map(targets.map((table) => [table.id, table]));
        const candidates = { projectId: context.projectId, targetsById };
        const creations = [];
        const updates = [];
        const columnAlignments = [];
        const failures = [];
        let matchedCount = 0;
        for (const requirement of requirements) {
            const packageTable = packageTablesById.get(requirement.id);
            if (!packageTable) {
                throw new n8n_workflow_1.UserError(`Package is missing the data table schema for "${requirement.name}" (${requirement.id}).`);
            }
            const matchedTargetTable = (0, data_table_matching_mode_1.matchTargetTable)(request.matchingMode, requirement, candidates);
            const effect = resolveRequirement(requirement, packageTable, matchedTargetTable, targetsById.get(requirement.id), request.missingMode, request.schemaConflictPolicy);
            if (effect.action === 'create')
                creations.push({ table: packageTable, requirement });
            else if (effect.action === 'update') {
                updates.push({ table: packageTable, operations: effect.operations, requirement });
            }
            else if (effect.action === 'align-columns') {
                columnAlignments.push({ table: packageTable, requirement });
                matchedCount++;
            }
            else if (effect.action === 'fail')
                failures.push(effect.failure);
            else if (matchedTargetTable)
                matchedCount++;
        }
        failures.push(...(await this.writeFailures(context, creations, updates, columnAlignments)));
        await this.assertColumnIdsAvailable([...creations, ...updates, ...columnAlignments].map(({ table }) => table));
        return {
            creations: creations.map(({ table }) => table),
            updates: updates.map(({ table, operations }) => ({ table, operations })),
            columnAlignments: columnAlignments.map(({ table }) => table),
            failures,
            matchedCount,
        };
    }
    async findDestructiveChanges(references, packageDataTables) {
        if (!this.moduleRegistry.isActive('data-table'))
            return [];
        const packageTablesById = new Map(packageDataTables.map((table) => [table.id, normalizeColumnIndexes(table)]));
        const targets = await this.dataTableService.findDataTablesByIds(references.map(({ id }) => id));
        const targetsById = new Map(targets.map((table) => [table.id, table]));
        return references.flatMap((reference) => {
            const packageTable = packageTablesById.get(reference.id);
            const target = (0, data_table_matching_mode_1.matchTargetTable)(n8n_packages_types_1.DataTableMatchingMode.ById, reference, {
                projectId: reference.projectId,
                targetsById,
            });
            if (!packageTable || !target)
                return [];
            const operations = (0, data_table_compat_1.diffDataTableSchema)(packageTable, target);
            if (!operations.some(({ destructive }) => destructive))
                return [];
            return [{ table: packageTable, operations, reference }];
        });
    }
    async apply(context, plan) {
        if (plan.creations.length > 0 && !(await hasProjectScope(context, 'dataTable:create'))) {
            throw new errors_1.ForbiddenError('User is missing a scope required to create a data table');
        }
        if (plan.updates.length + plan.columnAlignments.length > 0 &&
            !(await hasProjectScope(context, 'dataTable:update'))) {
            throw new errors_1.ForbiddenError('User is missing a scope required to update a data table');
        }
        for (const table of plan.creations) {
            await this.dataTableService.createDataTable(context.projectId, { name: table.name, columns: table.columns }, table.id, table.columns.map(({ id }) => id));
        }
        for (const table of [...plan.updates.map(({ table }) => table), ...plan.columnAlignments]) {
            await this.dataTableService.replaceSchema(table.id, context.projectId, {
                name: table.name,
                columns: table.columns,
            });
        }
    }
    async assertColumnIdsAvailable(tables) {
        const packageColumnsById = new Map();
        for (const table of tables) {
            for (const column of table.columns) {
                if (column.id)
                    packageColumnsById.set(column.id, { table, column });
            }
        }
        if (packageColumnsById.size === 0)
            return;
        const existing = await this.dataTableService.findTableIdsByColumnIds([
            ...packageColumnsById.keys(),
        ]);
        for (const { id, dataTableId } of existing) {
            const packageColumn = packageColumnsById.get(id);
            if (packageColumn && packageColumn.table.id !== dataTableId) {
                throw new n8n_workflow_1.UserError(`Data table "${packageColumn.table.name}": column "${packageColumn.column.name}" has id "${id}", but a column in another data table already uses this id.`);
            }
        }
    }
    async writeFailures(context, creations, updates, alignments) {
        const failures = [];
        if (creations.length > 0 && !(await hasProjectScope(context, 'dataTable:create'))) {
            failures.push({
                kind: 'permission-denied',
                missingScope: 'dataTable:create',
            });
        }
        const changedTables = [...updates, ...alignments];
        if (changedTables.length > 0 && !(await hasProjectScope(context, 'dataTable:update'))) {
            failures.push({
                kind: 'permission-denied',
                missingScope: 'dataTable:update',
            });
        }
        const nameClaims = [
            ...creations,
            ...updates.flatMap(({ table, requirement, operations }) => {
                const rename = operations.find((operation) => operation.kind === 'rename-table');
                return rename ? [{ table, requirement, currentName: rename.from }] : [];
            }),
        ];
        if (nameClaims.length === 0)
            return failures;
        const existingByName = new Map((await this.dataTableService.findDataTablesByNamesInProject(context.projectId, nameClaims.map(({ table }) => table.name))).map((table) => [table.name, table]));
        for (const claim of nameClaims) {
            const conflictingTableId = existingByName.get(claim.table.name)?.id ??
                nameClaims.find((other) => other !== claim && other.table.name === claim.table.name)?.table
                    .id;
            if (conflictingTableId) {
                failures.push((0, data_table_types_1.createFailure)(claim.requirement, 'name-conflict', {
                    name: claim.table.name,
                    conflictingTableId,
                    currentName: claim.currentName,
                }));
            }
        }
        return failures;
    }
};
exports.DataTableImporter = DataTableImporter;
exports.DataTableImporter = DataTableImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [data_table_service_1.DataTableService, backend_common_1.ModuleRegistry])
], DataTableImporter);
function resolveRequirement(requirement, packageTable, matchedTargetTable, existingTableWithSameId, missingMode, schemaConflictPolicy) {
    if (matchedTargetTable) {
        const incompatibility = (0, data_table_schema_conflict_policy_1.findSchemaConflict)(schemaConflictPolicy, packageTable.columns, matchedTargetTable.columns);
        if (incompatibility) {
            return {
                action: 'fail',
                failure: (0, data_table_types_1.createFailure)(requirement, 'schema-incompatible', {
                    ...incompatibility,
                    overwriteChanges: (0, data_table_compat_1.diffDataTableSchema)(packageTable, matchedTargetTable),
                }),
            };
        }
        if (schemaConflictPolicy === n8n_packages_types_1.DataTableSchemaConflictPolicy.Overwrite ||
            schemaConflictPolicy === n8n_packages_types_1.DataTableSchemaConflictPolicy.OverwriteNonDestructive) {
            const { pairs } = (0, pair_columns_1.pairDataTableColumns)(packageTable.columns, matchedTargetTable.columns);
            const operations = (0, data_table_compat_1.diffDataTableSchema)(packageTable, matchedTargetTable);
            if (operations.length > 0) {
                const [blocked] = (0, pair_columns_1.orderColumnRenames)(pairs).blocked;
                if (blocked) {
                    throw new n8n_workflow_1.UserError(`Data table "${packageTable.name}": cannot rename column "${blocked.target.name}" to "${blocked.source.name}". Another column has this name. Column name swaps and cycles are not supported.`);
                }
                return { action: 'update', operations };
            }
            const isAligned = pairs.every(({ source, target }) => (source.id === undefined || source.id === target.id) && source.index === target.index);
            if (!isAligned)
                return { action: 'align-columns' };
        }
        return { action: 'skip' };
    }
    const effect = (0, data_table_missing_mode_1.decideAbsentTable)(missingMode, requirement);
    if (effect.action !== 'create')
        return effect;
    if (existingTableWithSameId) {
        return {
            action: 'fail',
            failure: (0, data_table_types_1.createFailure)(requirement, 'id-conflict', {
                existingProjectId: existingTableWithSameId.projectId,
            }),
        };
    }
    return effect;
}
function normalizeColumnIndexes(table) {
    const columns = [...table.columns]
        .sort((a, b) => a.index - b.index || (a.name < b.name ? -1 : 1))
        .map((column, index) => ({ ...column, index }));
    return { ...table, columns };
}
async function hasProjectScope(context, scope) {
    return await (0, check_access_1.userHasScopes)(context.user, [scope], false, { projectId: context.projectId });
}
//# sourceMappingURL=data-table-importer.js.map