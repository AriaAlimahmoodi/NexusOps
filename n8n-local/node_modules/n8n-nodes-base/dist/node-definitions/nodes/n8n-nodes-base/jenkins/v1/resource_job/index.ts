/**
 * Jenkins - Job Resource
 * Re-exports all operation types for this resource.
 */

import type { JenkinsV1JobCopyNode } from './operation_copy';
import type { JenkinsV1JobCreateNode } from './operation_create';
import type { JenkinsV1JobTriggerNode } from './operation_trigger';
import type { JenkinsV1JobTriggerParamsNode } from './operation_trigger_params';

export * from './operation_copy';
export * from './operation_create';
export * from './operation_trigger';
export * from './operation_trigger_params';

export type JenkinsV1JobNode =
  | JenkinsV1JobCopyNode
  | JenkinsV1JobCreateNode
  | JenkinsV1JobTriggerNode
  | JenkinsV1JobTriggerParamsNode
  ;