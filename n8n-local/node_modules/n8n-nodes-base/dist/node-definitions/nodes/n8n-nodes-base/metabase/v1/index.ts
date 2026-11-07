/**
 * Metabase Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MetabaseV1AlertsNode } from './resource_alerts';
import type { MetabaseV1DatabasesNode } from './resource_databases';
import type { MetabaseV1MetricsNode } from './resource_metrics';
import type { MetabaseV1QuestionsNode } from './resource_questions';

export * from './resource_alerts';
export * from './resource_databases';
export * from './resource_metrics';
export * from './resource_questions';

export type MetabaseV1Node =
  | MetabaseV1AlertsNode
  | MetabaseV1DatabasesNode
  | MetabaseV1MetricsNode
  | MetabaseV1QuestionsNode
  ;