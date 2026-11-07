import { VariablesService } from '../../../../environments.ee/variables/variables.service.ee';
import type { VariableApplyResult, VariableConflict, VariableCreation, VariableImportPlan, VariableImportRequest, VariableLimitFailure, VariableOverwrite, VariableResolutionFailure } from './variable.types';
import type { ImportContext } from '../../n8n-packages.types';
export declare class VariableImporter {
    private readonly variablesService;
    constructor(variablesService: VariablesService);
    plan(context: ImportContext, request: VariableImportRequest): Promise<VariableImportPlan>;
    quotaFailure(creations: VariableCreation[]): Promise<VariableLimitFailure | undefined>;
    blockingFailures(request: VariableImportRequest, plan: VariableImportPlan): VariableResolutionFailure[];
    blockingConflicts(request: VariableImportRequest, plan: VariableImportPlan): VariableConflict[];
    apply(context: ImportContext, plan: VariableImportPlan): Promise<VariableApplyResult>;
    private variableExistsAtDestination;
    private targetScopes;
    assertCanCreate(context: ImportContext, creations: VariableCreation[], projectPendingCreation: boolean): Promise<void>;
    assertCanUpdate(context: ImportContext, overwrites: VariableOverwrite[]): Promise<void>;
}
