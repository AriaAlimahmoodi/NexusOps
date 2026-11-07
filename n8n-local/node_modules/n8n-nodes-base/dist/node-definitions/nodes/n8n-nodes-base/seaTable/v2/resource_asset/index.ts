/**
 * SeaTable - Asset Resource
 * Re-exports all operation types for this resource.
 */

import type { SeaTableV2AssetGetPublicURLNode } from './operation_get_public_u_r_l';
import type { SeaTableV2AssetUploadNode } from './operation_upload';

export * from './operation_get_public_u_r_l';
export * from './operation_upload';

export type SeaTableV2AssetNode =
  | SeaTableV2AssetGetPublicURLNode
  | SeaTableV2AssetUploadNode
  ;