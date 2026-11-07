/**
 * SecurityScorecard Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SecurityScorecardV1CompanyNode } from './resource_company';
import type { SecurityScorecardV1IndustryNode } from './resource_industry';
import type { SecurityScorecardV1InviteNode } from './resource_invite';
import type { SecurityScorecardV1PortfolioNode } from './resource_portfolio';
import type { SecurityScorecardV1PortfolioCompanyNode } from './resource_portfolio_company';
import type { SecurityScorecardV1ReportNode } from './resource_report';

export * from './resource_company';
export * from './resource_industry';
export * from './resource_invite';
export * from './resource_portfolio';
export * from './resource_portfolio_company';
export * from './resource_report';

export type SecurityScorecardV1Node =
  | SecurityScorecardV1CompanyNode
  | SecurityScorecardV1IndustryNode
  | SecurityScorecardV1InviteNode
  | SecurityScorecardV1PortfolioNode
  | SecurityScorecardV1PortfolioCompanyNode
  | SecurityScorecardV1ReportNode
  ;