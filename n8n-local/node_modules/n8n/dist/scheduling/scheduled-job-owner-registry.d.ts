import { ScheduledJobOwnerRegistry } from '@n8n/scheduler';
import type { AgentScheduledJobOwner } from './agent-scheduled-job-owner';
import type { SystemTaskScheduledJobOwner } from './system-tasks/system-task-scheduled-job-owner';
import type { WorkflowScheduledJobOwner } from './workflow-scheduled-job-owner';
export declare function createScheduledJobOwnerRegistry(workflowOwner: WorkflowScheduledJobOwner, agentOwner: AgentScheduledJobOwner, systemTaskOwner: SystemTaskScheduledJobOwner): ScheduledJobOwnerRegistry;
