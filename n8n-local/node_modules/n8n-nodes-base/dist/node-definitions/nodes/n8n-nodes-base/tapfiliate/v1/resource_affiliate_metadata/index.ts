/**
 * Tapfiliate - AffiliateMetadata Resource
 * Re-exports all operation types for this resource.
 */

import type { TapfiliateV1AffiliateMetadataAddNode } from './operation_add';
import type { TapfiliateV1AffiliateMetadataRemoveNode } from './operation_remove';
import type { TapfiliateV1AffiliateMetadataUpdateNode } from './operation_update';

export * from './operation_add';
export * from './operation_remove';
export * from './operation_update';

export type TapfiliateV1AffiliateMetadataNode =
  | TapfiliateV1AffiliateMetadataAddNode
  | TapfiliateV1AffiliateMetadataRemoveNode
  | TapfiliateV1AffiliateMetadataUpdateNode
  ;