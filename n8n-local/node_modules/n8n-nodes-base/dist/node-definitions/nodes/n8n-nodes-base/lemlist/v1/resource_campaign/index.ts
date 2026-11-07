/**
 * Lemlist - Campaign Resource
 * Re-exports all operation types for this resource.
 */

import type { LemlistV1CampaignGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type LemlistV1CampaignNode = LemlistV1CampaignGetAllNode;