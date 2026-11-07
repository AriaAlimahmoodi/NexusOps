import type { BreakingChangeAffectedWorkflow, BreakingChangeRecommendation, BreakingChangeRuleImpact, BreakingChangeVersion } from '@n8n/api-types';
import type { WorkflowEntity } from '@n8n/db';
import type { INode } from 'n8n-workflow';
import type { BatchWorkflowDetectionReport, InstanceDetectionReport, WorkflowDetectionReport } from './detection.types';
export declare const enum BreakingChangeCategory {
    workflow = "workflow",
    instance = "instance",
    environment = "environment",
    database = "database",
    infrastructure = "infrastructure"
}
export interface BreakingChangeRuleMetadata {
    version: BreakingChangeVersion;
    title: string;
    description: string;
    category: BreakingChangeCategory;
    impact: BreakingChangeRuleImpact;
    documentationUrl?: string;
}
export interface IBreakingChangeInstanceRule {
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    detect(): Promise<InstanceDetectionReport>;
}
export interface IBreakingChangeWorkflowRule {
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    getRecommendations(workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
    detectWorkflow(workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<WorkflowDetectionReport>;
}
export interface IBreakingChangeBatchWorkflowRule {
    id: string;
    getMetadata(): BreakingChangeRuleMetadata;
    getRecommendations(workflowResults: BreakingChangeAffectedWorkflow[]): Promise<BreakingChangeRecommendation[]>;
    collectWorkflowData(workflow: WorkflowEntity, nodesGroupedByType: Map<string, INode[]>): Promise<void>;
    produceReport(): Promise<BatchWorkflowDetectionReport>;
    reset(): void;
}
export type IBreakingChangeRule = IBreakingChangeInstanceRule | IBreakingChangeWorkflowRule | IBreakingChangeBatchWorkflowRule;
export type WorkflowLevelRule = IBreakingChangeWorkflowRule | IBreakingChangeBatchWorkflowRule;
export declare function isWorkflowLevelRule(rule: IBreakingChangeRule): rule is WorkflowLevelRule;
export declare function isInstanceRule(rule: IBreakingChangeRule): rule is IBreakingChangeInstanceRule;
