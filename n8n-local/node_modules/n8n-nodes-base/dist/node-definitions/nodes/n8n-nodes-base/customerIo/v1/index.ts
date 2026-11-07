/**
 * Customer.io Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { CustomerIoV1CustomerNode } from './resource_customer';
import type { CustomerIoV1EventNode } from './resource_event';
import type { CustomerIoV1CampaignNode } from './resource_campaign';
import type { CustomerIoV1SegmentNode } from './resource_segment';

export * from './resource_customer';
export * from './resource_event';
export * from './resource_campaign';
export * from './resource_segment';

export type CustomerIoV1Node =
  | CustomerIoV1CustomerNode
  | CustomerIoV1EventNode
  | CustomerIoV1CampaignNode
  | CustomerIoV1SegmentNode
  ;