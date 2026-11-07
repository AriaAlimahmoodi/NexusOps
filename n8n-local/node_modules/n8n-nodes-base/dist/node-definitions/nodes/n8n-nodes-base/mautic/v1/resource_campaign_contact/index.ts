/**
 * Mautic - CampaignContact Resource
 * Re-exports all operation types for this resource.
 */

import type { MauticV1CampaignContactAddNode } from './operation_add';
import type { MauticV1CampaignContactRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type MauticV1CampaignContactNode =
  | MauticV1CampaignContactAddNode
  | MauticV1CampaignContactRemoveNode
  ;