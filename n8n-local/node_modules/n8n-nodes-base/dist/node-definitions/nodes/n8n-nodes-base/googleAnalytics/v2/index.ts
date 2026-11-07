/**
 * Google Analytics Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { GoogleAnalyticsV2ReportNode } from './resource_report';
import type { GoogleAnalyticsV2UserActivityNode } from './resource_user_activity';

export * from './resource_report';
export * from './resource_user_activity';

export type GoogleAnalyticsV2Node =
  | GoogleAnalyticsV2ReportNode
  | GoogleAnalyticsV2UserActivityNode
  ;