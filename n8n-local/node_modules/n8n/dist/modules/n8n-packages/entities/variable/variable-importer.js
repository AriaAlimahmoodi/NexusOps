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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VariableImporter = void 0;
const di_1 = require("@n8n/di");
const permissions_1 = require("@n8n/permissions");
const uniqBy_1 = __importDefault(require("lodash/uniqBy"));
const n8n_workflow_1 = require("n8n-workflow");
const variables_service_ee_1 = require("../../../../environments.ee/variables/variables.service.ee");
const errors_1 = require("@n8n/errors");
const variable_count_limit_reached_error_1 = require("../../../../errors/variable-count-limit-reached.error");
const check_access_1 = require("../../../../permissions.ee/check-access");
const variable_missing_mode_1 = require("./variable-missing-mode");
const variable_types_1 = require("./variable.types");
const n8n_packages_types_1 = require("../../n8n-packages.types");
let VariableImporter = class VariableImporter {
    constructor(variablesService) {
        this.variablesService = variablesService;
    }
    async plan(context, request) {
        const requirements = request.requirements ?? [];
        if (requirements.length === 0) {
            return { matched: [], missing: [], creations: [], conflicts: [], overwrites: [] };
        }
        const allVariables = await this.variablesService.getAllCached();
        const variablesByKey = new Map();
        for (const variable of allVariables) {
            const bucket = variablesByKey.get(variable.key);
            if (bucket)
                bucket.push(variable);
            else
                variablesByKey.set(variable.key, [variable]);
        }
        const matched = [];
        const missing = [];
        const creations = [];
        const conflicts = [];
        const overwrites = [];
        const createsMissing = (0, variable_missing_mode_1.variableMissingModeCreates)(request.missingMode);
        const usesPackageValue = (0, variable_missing_mode_1.variableMissingModeUsesPackageValue)(request.missingMode);
        const comparesValues = request.conflictPolicy !== n8n_packages_types_1.VariableConflictPolicy.KeepExisting;
        const overwritesConflicts = request.conflictPolicy === n8n_packages_types_1.VariableConflictPolicy.Overwrite;
        for (const requirement of requirements) {
            const picked = (0, n8n_workflow_1.pickVariableForProject)(variablesByKey.get(requirement.name) ?? [], requirement.name, context.projectId);
            if (picked) {
                matched.push(requirement.name);
                const packageValue = requirement.packageValue;
                if (!comparesValues || !packageValue || packageValue === picked.value) {
                    continue;
                }
                const scope = picked.project ? { projectId: picked.project.id } : {};
                conflicts.push({ name: requirement.name, ...scope });
                if (overwritesConflicts) {
                    overwrites.push({
                        variableId: picked.id,
                        name: requirement.name,
                        ...scope,
                        value: packageValue,
                    });
                }
                continue;
            }
            missing.push({ name: requirement.name });
            if (createsMissing) {
                const value = usesPackageValue ? requirement.packageValue : undefined;
                creations.push({
                    name: requirement.name,
                    ...(requirement.globalPlacement ? {} : { projectId: context.projectId }),
                    ...(value !== undefined ? { value } : {}),
                });
            }
        }
        return { matched, missing, creations, conflicts, overwrites };
    }
    async quotaFailure(creations) {
        if (creations.length === 0)
            return undefined;
        return (0, variable_types_1.computeVariableLimitFailure)((0, uniqBy_1.default)(creations, variable_types_1.destinationKey), await this.variablesService.getRemainingVariableQuota());
    }
    blockingFailures(request, plan) {
        return (0, variable_missing_mode_1.variableBlockingFailures)(request.missingMode, plan);
    }
    blockingConflicts(request, plan) {
        return request.conflictPolicy === n8n_packages_types_1.VariableConflictPolicy.Fail ? plan.conflicts : [];
    }
    async apply(context, plan) {
        const created = [];
        const stubbed = [];
        const skippedExisting = [];
        for (const creation of plan.creations) {
            if (await this.variableExistsAtDestination(creation)) {
                skippedExisting.push(creation.name);
                continue;
            }
            try {
                await this.variablesService.create(context.user, {
                    key: creation.name,
                    type: 'string',
                    value: creation.value ?? '',
                    ...(creation.projectId ? { projectId: creation.projectId } : {}),
                });
                if (creation.value) {
                    created.push(creation.name);
                }
                else {
                    stubbed.push(creation.name);
                }
            }
            catch (error) {
                if (error instanceof variable_count_limit_reached_error_1.VariableCountLimitReachedError &&
                    (await this.variableExistsAtDestination(creation))) {
                    skippedExisting.push(creation.name);
                    continue;
                }
                throw error;
            }
        }
        const updated = [];
        for (const overwrite of plan.overwrites) {
            const current = await this.variablesService.getCached(overwrite.variableId);
            if (!current || current.value === overwrite.value)
                continue;
            await this.variablesService.update(context.user, overwrite.variableId, {
                value: overwrite.value,
            });
            updated.push(overwrite.name);
        }
        return {
            created: [...new Set(created)],
            stubbed: [...new Set(stubbed)],
            skippedExisting: [...new Set(skippedExisting)],
            updated: [...new Set(updated)],
        };
    }
    async variableExistsAtDestination(creation) {
        const destination = (0, variable_types_1.destinationKey)(creation);
        const allVariables = await this.variablesService.getAllCached();
        return allVariables.some((variable) => (0, variable_types_1.destinationKey)({ name: variable.key, projectId: variable.project?.id }) === destination);
    }
    targetScopes(targets, skipProjectId) {
        const projectIds = new Set();
        for (const { projectId } of targets) {
            if (projectId && projectId !== skipProjectId)
                projectIds.add(projectId);
        }
        return {
            touchesGlobal: targets.some(({ projectId }) => !projectId),
            projectIds,
        };
    }
    async assertCanCreate(context, creations, projectPendingCreation) {
        const { touchesGlobal, projectIds } = this.targetScopes(creations, projectPendingCreation ? context.projectId : undefined);
        if (touchesGlobal && !(0, permissions_1.hasGlobalScope)(context.user, 'variable:create')) {
            throw new errors_1.ForbiddenError('You are not allowed to create global variables');
        }
        for (const projectId of projectIds) {
            const projectVariableCreationAllowed = await (0, check_access_1.userHasScopes)(context.user, ['projectVariable:create'], false, {
                projectId,
            });
            if (!projectVariableCreationAllowed) {
                throw new errors_1.ForbiddenError('You are not allowed to create variables in this project');
            }
        }
    }
    async assertCanUpdate(context, overwrites) {
        const { touchesGlobal, projectIds } = this.targetScopes(overwrites);
        if (touchesGlobal && !(0, permissions_1.hasGlobalScope)(context.user, 'variable:update')) {
            throw new errors_1.ForbiddenError('You are not allowed to update global variables');
        }
        for (const projectId of projectIds) {
            const projectVariableUpdateAllowed = await (0, check_access_1.userHasScopes)(context.user, ['projectVariable:update'], false, {
                projectId,
            });
            if (!projectVariableUpdateAllowed) {
                throw new errors_1.ForbiddenError('You are not allowed to update variables in this project');
            }
        }
    }
};
exports.VariableImporter = VariableImporter;
exports.VariableImporter = VariableImporter = __decorate([
    (0, di_1.Service)(),
    __metadata("design:paramtypes", [variables_service_ee_1.VariablesService])
], VariableImporter);
//# sourceMappingURL=variable-importer.js.map