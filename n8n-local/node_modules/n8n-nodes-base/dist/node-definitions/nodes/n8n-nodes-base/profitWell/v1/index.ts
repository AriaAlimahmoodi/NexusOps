/**
 * ProfitWell Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ProfitWellV1CompanyNode } from './resource_company';
import type { ProfitWellV1MetricNode } from './resource_metric';

export * from './resource_company';
export * from './resource_metric';

export type ProfitWellV1Node =
  | ProfitWellV1CompanyNode
  | ProfitWellV1MetricNode
  ;