/**
 * Lemlist Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LemlistV1ActivityNode } from './resource_activity';
import type { LemlistV1CampaignNode } from './resource_campaign';
import type { LemlistV1LeadNode } from './resource_lead';
import type { LemlistV1TeamNode } from './resource_team';
import type { LemlistV1UnsubscribeNode } from './resource_unsubscribe';

export * from './resource_activity';
export * from './resource_campaign';
export * from './resource_lead';
export * from './resource_team';
export * from './resource_unsubscribe';

export type LemlistV1Node =
  | LemlistV1ActivityNode
  | LemlistV1CampaignNode
  | LemlistV1LeadNode
  | LemlistV1TeamNode
  | LemlistV1UnsubscribeNode
  ;