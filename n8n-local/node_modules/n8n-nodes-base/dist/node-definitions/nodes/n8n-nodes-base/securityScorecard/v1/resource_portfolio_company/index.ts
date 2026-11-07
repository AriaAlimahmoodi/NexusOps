/**
 * SecurityScorecard - PortfolioCompany Resource
 * Re-exports all operation types for this resource.
 */

import type { SecurityScorecardV1PortfolioCompanyAddNode } from './operation_add';
import type { SecurityScorecardV1PortfolioCompanyGetAllNode } from './operation_get_all';
import type { SecurityScorecardV1PortfolioCompanyRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_get_all';
export * from './operation_remove';

export type SecurityScorecardV1PortfolioCompanyNode =
  | SecurityScorecardV1PortfolioCompanyAddNode
  | SecurityScorecardV1PortfolioCompanyGetAllNode
  | SecurityScorecardV1PortfolioCompanyRemoveNode
  ;