/**
 * Tapfiliate - Affiliate Resource
 * Re-exports all operation types for this resource.
 */

import type { TapfiliateV1AffiliateCreateNode } from './operation_create';
import type { TapfiliateV1AffiliateDeleteNode } from './operation_delete';
import type { TapfiliateV1AffiliateGetNode } from './operation_get';
import type { TapfiliateV1AffiliateGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type TapfiliateV1AffiliateNode =
  | TapfiliateV1AffiliateCreateNode
  | TapfiliateV1AffiliateDeleteNode
  | TapfiliateV1AffiliateGetNode
  | TapfiliateV1AffiliateGetAllNode
  ;