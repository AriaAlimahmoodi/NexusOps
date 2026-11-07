/**
 * Google Analytics Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleAnalyticsV1ReportNode } from './resource_report';
import type { GoogleAnalyticsV1UserActivityNode } from './resource_user_activity';

export * from './resource_report';
export * from './resource_user_activity';

export type GoogleAnalyticsV1Node =
  | GoogleAnalyticsV1ReportNode
  | GoogleAnalyticsV1UserActivityNode
  ;