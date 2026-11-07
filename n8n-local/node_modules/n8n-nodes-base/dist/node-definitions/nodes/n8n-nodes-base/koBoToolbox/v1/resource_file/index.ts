/**
 * KoBoToolbox - File Resource
 * Re-exports all operation types for this resource.
 */

import type { KoBoToolboxV1FileCreateNode } from './operation_create';
import type { KoBoToolboxV1FileDeleteNode } from './operation_delete';
import type { KoBoToolboxV1FileGetNode } from './operation_get';
import type { KoBoToolboxV1FileGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';

export type KoBoToolboxV1FileNode =
  | KoBoToolboxV1FileCreateNode
  | KoBoToolboxV1FileDeleteNode
  | KoBoToolboxV1FileGetNode
  | KoBoToolboxV1FileGetAllNode
  ;