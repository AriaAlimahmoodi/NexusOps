/**
 * Lemlist Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { LemlistV2ActivityNode } from './resource_activity';
import type { LemlistV2CampaignNode } from './resource_campaign';
import type { LemlistV2EnrichNode } from './resource_enrich';
import type { LemlistV2LeadNode } from './resource_lead';
import type { LemlistV2TeamNode } from './resource_team';
import type { LemlistV2UnsubscribeNode } from './resource_unsubscribe';

export * from './resource_activity';
export * from './resource_campaign';
export * from './resource_enrich';
export * from './resource_lead';
export * from './resource_team';
export * from './resource_unsubscribe';

export type LemlistV2Node =
  | LemlistV2ActivityNode
  | LemlistV2CampaignNode
  | LemlistV2EnrichNode
  | LemlistV2LeadNode
  | LemlistV2TeamNode
  | LemlistV2UnsubscribeNode
  ;