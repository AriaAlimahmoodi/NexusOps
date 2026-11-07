/**
 * Splunk - SearchConfiguration Resource
 * Re-exports all operation types for this resource.
 */

import type { SplunkV1SearchConfigurationDeleteNode } from './operation_delete';
import type { SplunkV1SearchConfigurationGetNode } from './operation_get';
import type { SplunkV1SearchConfigurationGetAllNode } from './operation_get_all';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type SplunkV1SearchConfigurationNode =
  | SplunkV1SearchConfigurationDeleteNode
  | SplunkV1SearchConfigurationGetNode
  | SplunkV1SearchConfigurationGetAllNode
  ;