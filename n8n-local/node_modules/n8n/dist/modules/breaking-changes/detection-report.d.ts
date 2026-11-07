import type { BreakingChangeWorkflowIssue } from '@n8n/api-types';
import type { INode } from 'n8n-workflow';
import type { InstanceDetectionReport, WorkflowDetectionReport } from './types';
export declare const NOT_AFFECTED_INSTANCE: InstanceDetectionReport;
export declare function reportAffectedNodes<T extends INode>(nodes: T[], toIssue: (node: T) => Omit<BreakingChangeWorkflowIssue, 'nodeId' | 'nodeName'>): WorkflowDetectionReport;
