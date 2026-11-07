import { WorkflowCreationService } from '../../../../workflows/workflow-creation.service';
import { WorkflowFinderService } from '../../../../workflows/workflow-finder.service';
import { WorkflowService } from '../../../../workflows/workflow.service';
import { WorkflowImportMatchService } from './workflow-import-match.service';
import type { PersistedWorkflowOutcome, PreparedWorkflow, WorkflowImportContext, WorkflowImportPlan, WorkflowPlanItem } from './workflow-import.types';
import type { ImportBindingMap, ImportContext, ImportWorkflowProperties, PackageImportBindings } from '../../n8n-packages.types';
export interface WorkflowImportResult {
    outcomes: PersistedWorkflowOutcome[];
    bindings: PackageImportBindings;
}
export declare class WorkflowImporter {
    private readonly workflowImportMatchService;
    private readonly workflowCreationService;
    private readonly workflowService;
    private readonly workflowFinderService;
    constructor(workflowImportMatchService: WorkflowImportMatchService, workflowCreationService: WorkflowCreationService, workflowService: WorkflowService, workflowFinderService: WorkflowFinderService);
    plan(context: ImportContext, prepared: PreparedWorkflow[], options: ImportWorkflowProperties): Promise<WorkflowImportPlan>;
    private collectArchiveForbidden;
    private collectIdConflicts;
    apply(context: WorkflowImportContext, plan: WorkflowImportPlan, bindings: PackageImportBindings): Promise<WorkflowImportResult>;
    private applyItem;
    private persistWorkflow;
    private transitionArchive;
}
export declare function collectPlannedWorkflowBindings(items: WorkflowPlanItem[]): ImportBindingMap;
