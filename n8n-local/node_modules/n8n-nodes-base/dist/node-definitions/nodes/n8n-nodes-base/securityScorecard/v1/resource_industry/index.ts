/**
 * SecurityScorecard - Industry Resource
 * Re-exports all operation types for this resource.
 */

import type { SecurityScorecardV1IndustryGetFactorNode } from './operation_get_factor';
import type { SecurityScorecardV1IndustryGetFactorHistoricalNode } from './operation_get_factor_historical';
import type { SecurityScorecardV1IndustryGetScoreNode } from './operation_get_score';

export * from './operation_get_factor';
export * from './operation_get_factor_historical';
export * from './operation_get_score';

export type SecurityScorecardV1IndustryNode =
  | SecurityScorecardV1IndustryGetFactorNode
  | SecurityScorecardV1IndustryGetFactorHistoricalNode
  | SecurityScorecardV1IndustryGetScoreNode
  ;