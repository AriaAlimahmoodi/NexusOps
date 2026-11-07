/**
 * Emelia - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { EmeliaV1CampaignAddContactNode } from './operation_add_contact';
import type { EmeliaV1CampaignCreateNode } from './operation_create';
import type { EmeliaV1CampaignDuplicateNode } from './operation_duplicate';
import type { EmeliaV1CampaignGetNode } from './operation_get';
import type { EmeliaV1CampaignGetAllNode } from './operation_get_all';
import type { EmeliaV1CampaignPauseNode } from './operation_pause';
import type { EmeliaV1CampaignStartNode } from './operation_start';

export * from './operation_add_contact';
export * from './operation_create';
export * from './operation_duplicate';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_pause';
export * from './operation_start';

export type EmeliaV1CampaignNode =
  | EmeliaV1CampaignAddContactNode
  | EmeliaV1CampaignCreateNode
  | EmeliaV1CampaignDuplicateNode
  | EmeliaV1CampaignGetNode
  | EmeliaV1CampaignGetAllNode
  | EmeliaV1CampaignPauseNode
  | EmeliaV1CampaignStartNode
  ;