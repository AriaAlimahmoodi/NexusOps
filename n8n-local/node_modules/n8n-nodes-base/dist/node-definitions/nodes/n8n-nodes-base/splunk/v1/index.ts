/**
 * Splunk Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SplunkV1FiredAlertNode } from './resource_fired_alert';
import type { SplunkV1SearchConfigurationNode } from './resource_search_configuration';
import type { SplunkV1SearchJobNode } from './resource_search_job';
import type { SplunkV1SearchResultNode } from './resource_search_result';
import type { SplunkV1UserNode } from './resource_user';

export * from './resource_fired_alert';
export * from './resource_search_configuration';
export * from './resource_search_job';
export * from './resource_search_result';
export * from './resource_user';

export type SplunkV1Node =
  | SplunkV1FiredAlertNode
  | SplunkV1SearchConfigurationNode
  | SplunkV1SearchJobNode
  | SplunkV1SearchResultNode
  | SplunkV1UserNode
  ;