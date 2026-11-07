/**
 * SecurityScorecard - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { SecurityScorecardV1CompanyGetFactorNode } from './operation_get_factor';
import type { SecurityScorecardV1CompanyGetFactorHistoricalNode } from './operation_get_factor_historical';
import type { SecurityScorecardV1CompanyGetHistoricalScoreNode } from './operation_get_historical_score';
import type { SecurityScorecardV1CompanyGetScorePlanNode } from './operation_get_score_plan';
import type { SecurityScorecardV1CompanyGetScorecardNode } from './operation_get_scorecard';

export * from './operation_get_factor';
export * from './operation_get_factor_historical';
export * from './operation_get_historical_score';
export * from './operation_get_score_plan';
export * from './operation_get_scorecard';

export type SecurityScorecardV1CompanyNode =
  | SecurityScorecardV1CompanyGetFactorNode
  | SecurityScorecardV1CompanyGetFactorHistoricalNode
  | SecurityScorecardV1CompanyGetHistoricalScoreNode
  | SecurityScorecardV1CompanyGetScorePlanNode
  | SecurityScorecardV1CompanyGetScorecardNode
  ;