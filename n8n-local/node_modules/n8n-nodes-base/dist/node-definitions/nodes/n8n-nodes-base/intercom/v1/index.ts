/**
 * Intercom Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { IntercomV1CompanyNode } from './resource_company';
import type { IntercomV1LeadNode } from './resource_lead';
import type { IntercomV1UserNode } from './resource_user';

export * from './resource_company';
export * from './resource_lead';
export * from './resource_user';

export type IntercomV1Node =
  | IntercomV1CompanyNode
  | IntercomV1LeadNode
  | IntercomV1UserNode
  ;