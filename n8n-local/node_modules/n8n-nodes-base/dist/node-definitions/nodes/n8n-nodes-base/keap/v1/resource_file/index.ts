/**
 * Keap - File Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1FileDeleteNode } from './operation_delete';
import type { KeapV1FileGetAllNode } from './operation_get_all';
import type { KeapV1FileUploadNode } from './operation_upload';

export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_upload';

export type KeapV1FileNode =
  | KeapV1FileDeleteNode
  | KeapV1FileGetAllNode
  | KeapV1FileUploadNode
  ;