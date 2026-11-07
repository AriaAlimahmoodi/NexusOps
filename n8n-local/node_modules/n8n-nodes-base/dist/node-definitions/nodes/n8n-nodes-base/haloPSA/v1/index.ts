/**
 * HaloPSA Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { HaloPSAV1ClientNode } from './resource_client';
import type { HaloPSAV1SiteNode } from './resource_site';
import type { HaloPSAV1TicketNode } from './resource_ticket';
import type { HaloPSAV1UserNode } from './resource_user';

export * from './resource_client';
export * from './resource_site';
export * from './resource_ticket';
export * from './resource_user';

export type HaloPSAV1Node =
  | HaloPSAV1ClientNode
  | HaloPSAV1SiteNode
  | HaloPSAV1TicketNode
  | HaloPSAV1UserNode
  ;