/**
 * Sendy Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SendyV1CampaignNode } from './resource_campaign';
import type { SendyV1SubscriberNode } from './resource_subscriber';

export * from './resource_campaign';
export * from './resource_subscriber';

export type SendyV1Node =
  | SendyV1CampaignNode
  | SendyV1SubscriberNode
  ;