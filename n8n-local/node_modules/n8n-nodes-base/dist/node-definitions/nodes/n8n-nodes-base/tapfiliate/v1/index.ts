/**
 * Tapfiliate Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { TapfiliateV1AffiliateNode } from './resource_affiliate';
import type { TapfiliateV1AffiliateMetadataNode } from './resource_affiliate_metadata';
import type { TapfiliateV1ProgramAffiliateNode } from './resource_program_affiliate';

export * from './resource_affiliate';
export * from './resource_affiliate_metadata';
export * from './resource_program_affiliate';

export type TapfiliateV1Node =
  | TapfiliateV1AffiliateNode
  | TapfiliateV1AffiliateMetadataNode
  | TapfiliateV1ProgramAffiliateNode
  ;