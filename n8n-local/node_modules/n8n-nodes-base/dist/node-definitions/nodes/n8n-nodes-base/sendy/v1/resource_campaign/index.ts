/**
 * Sendy - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { SendyV1CampaignCreateNode } from './operation_create';

export * from './operation_create';

export type SendyV1CampaignNode = SendyV1CampaignCreateNode;