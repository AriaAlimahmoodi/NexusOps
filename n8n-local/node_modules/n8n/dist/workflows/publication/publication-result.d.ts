export type PublicationSkipReason = 'workflow-not-found' | 'node-ids-healed' | 'superseded';
import type { WorkflowPublicationTriggerKind } from '@n8n/db';
import type { TriggerTeardownFailure } from '../../workflows/triggers/workflow-trigger-activator';
type ActivatedTriggerPublicationStatus = {
    nodeId: string;
    nodeName: string;
    status: 'activated';
    triggerKind: WorkflowPublicationTriggerKind;
};
export type FailedTriggerPublicationStatus = {
    nodeId: string;
    nodeName: string;
    status: 'failed';
    triggerKind: WorkflowPublicationTriggerKind;
    errorMessage: string;
};
export type TriggerPublicationStatus = ActivatedTriggerPublicationStatus | FailedTriggerPublicationStatus;
export type PublicationResult = {
    type: 'completed';
    triggerStatuses: TriggerPublicationStatus[];
    teardownFailures?: TriggerTeardownFailure[];
} | {
    type: 'unpublished';
    teardownFailures?: TriggerTeardownFailure[];
} | {
    type: 'skipped';
    reason: PublicationSkipReason;
} | {
    type: 'version-missing';
} | {
    type: 'partial';
    triggerStatuses: TriggerPublicationStatus[];
    teardownFailures?: TriggerTeardownFailure[];
} | {
    type: 'failed';
    error: Error;
    triggerStatuses?: TriggerPublicationStatus[];
    teardownFailures?: TriggerTeardownFailure[];
};
export {};
