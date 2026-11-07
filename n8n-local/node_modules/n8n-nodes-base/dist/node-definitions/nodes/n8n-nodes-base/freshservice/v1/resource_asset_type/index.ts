/**
 * Freshservice - AssetType Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshserviceV1AssetTypeCreateNode } from './operation_create';
import type { FreshserviceV1AssetTypeDeleteNode } from './operation_delete';
import type { FreshserviceV1AssetTypeGetNode } from './operation_get';
import type { FreshserviceV1AssetTypeGetAllNode } from './operation_get_all';
import type { FreshserviceV1AssetTypeUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshserviceV1AssetTypeNode =
  | FreshserviceV1AssetTypeCreateNode
  | FreshserviceV1AssetTypeDeleteNode
  | FreshserviceV1AssetTypeGetNode
  | FreshserviceV1AssetTypeGetAllNode
  | FreshserviceV1AssetTypeUpdateNode
  ;