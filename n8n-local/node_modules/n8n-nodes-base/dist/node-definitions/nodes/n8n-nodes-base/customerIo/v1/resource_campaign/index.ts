/**
 * Customer.io - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { CustomerIoV1CampaignGetNode } from './operation_get';
import type { CustomerIoV1CampaignGetAllNode } from './operation_get_all';
import type { CustomerIoV1CampaignGetMetricsNode } from './operation_get_metrics';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_metrics';

export type CustomerIoV1CampaignNode =
  | CustomerIoV1CampaignGetNode
  | CustomerIoV1CampaignGetAllNode
  | CustomerIoV1CampaignGetMetricsNode
  ;