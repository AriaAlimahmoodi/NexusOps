/**
 * Oura Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { OuraV1ProfileNode } from './resource_profile';
import type { OuraV1SummaryNode } from './resource_summary';

export * from './resource_profile';
export * from './resource_summary';

export type OuraV1Node =
  | OuraV1ProfileNode
  | OuraV1SummaryNode
  ;