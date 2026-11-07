/**
 * SecurityScorecard - Portfolio Resource
 * Re-exports all operation types for this resource.
 */

import type { SecurityScorecardV1PortfolioCreateNode } from './operation_create';
import type { SecurityScorecardV1PortfolioDeleteNode } from './operation_delete';
import type { SecurityScorecardV1PortfolioGetAllNode } from './operation_get_all';
import type { SecurityScorecardV1PortfolioUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type SecurityScorecardV1PortfolioNode =
  | SecurityScorecardV1PortfolioCreateNode
  | SecurityScorecardV1PortfolioDeleteNode
  | SecurityScorecardV1PortfolioGetAllNode
  | SecurityScorecardV1PortfolioUpdateNode
  ;