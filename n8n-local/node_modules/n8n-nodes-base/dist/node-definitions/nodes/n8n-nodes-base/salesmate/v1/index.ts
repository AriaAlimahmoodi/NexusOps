/**
 * Salesmate Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SalesmateV1ActivityNode } from './resource_activity';
import type { SalesmateV1CompanyNode } from './resource_company';
import type { SalesmateV1DealNode } from './resource_deal';

export * from './resource_activity';
export * from './resource_company';
export * from './resource_deal';

export type SalesmateV1Node =
  | SalesmateV1ActivityNode
  | SalesmateV1CompanyNode
  | SalesmateV1DealNode
  ;