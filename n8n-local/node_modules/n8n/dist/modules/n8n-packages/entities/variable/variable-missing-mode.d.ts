import type { VariableImportPlan, VariableResolutionFailure } from './variable.types';
import { VariableMissingMode } from '../../n8n-packages.types';
export declare function variableMissingModeCreates(mode: VariableMissingMode): boolean;
export declare function variableMissingModeUsesPackageValue(mode: VariableMissingMode): boolean;
export declare function variableBlockingFailures(mode: VariableMissingMode, plan: VariableImportPlan): VariableResolutionFailure[];
