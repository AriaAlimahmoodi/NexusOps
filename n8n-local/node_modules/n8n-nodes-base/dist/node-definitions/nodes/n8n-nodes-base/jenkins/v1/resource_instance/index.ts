/**
 * Jenkins - Instance Resource
 * Re-exports all operation types for this resource.
 */

import type { JenkinsV1InstanceCancelQuietDownNode } from './operation_cancel_quiet_down';
import type { JenkinsV1InstanceExitNode } from './operation_exit';
import type { JenkinsV1InstanceQuietDownNode } from './operation_quiet_down';
import type { JenkinsV1InstanceRestartNode } from './operation_restart';
import type { JenkinsV1InstanceSafeExitNode } from './operation_safe_exit';
import type { JenkinsV1InstanceSafeRestartNode } from './operation_safe_restart';

export * from './operation_cancel_quiet_down';
export * from './operation_exit';
export * from './operation_quiet_down';
export * from './operation_restart';
export * from './operation_safe_exit';
export * from './operation_safe_restart';

export type JenkinsV1InstanceNode =
  | JenkinsV1InstanceCancelQuietDownNode
  | JenkinsV1InstanceExitNode
  | JenkinsV1InstanceQuietDownNode
  | JenkinsV1InstanceRestartNode
  | JenkinsV1InstanceSafeExitNode
  | JenkinsV1InstanceSafeRestartNode
  ;