/**
 * Splunk Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { SplunkV2AlertNode } from './resource_alert';
import type { SplunkV2ReportNode } from './resource_report';
import type { SplunkV2SearchNode } from './resource_search';
import type { SplunkV2UserNode } from './resource_user';

export * from './resource_alert';
export * from './resource_report';
export * from './resource_search';
export * from './resource_user';

export type SplunkV2Node =
  | SplunkV2AlertNode
  | SplunkV2ReportNode
  | SplunkV2SearchNode
  | SplunkV2UserNode
  ;