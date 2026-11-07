/**
 * Demio Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { DemioV1EventNode } from './resource_event';
import type { DemioV1ReportNode } from './resource_report';

export * from './resource_event';
export * from './resource_report';

export type DemioV1Node =
  | DemioV1EventNode
  | DemioV1ReportNode
  ;