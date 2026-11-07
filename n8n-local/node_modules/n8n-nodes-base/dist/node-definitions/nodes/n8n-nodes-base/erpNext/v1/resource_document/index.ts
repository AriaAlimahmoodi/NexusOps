/**
 * ERPNext - Document Resource
 * Re-exports all operation types for this resource.
 */

import type { ErpNextV1DocumentCreateNode } from './operation_create';
import type { ErpNextV1DocumentDeleteNode } from './operation_delete';
import type { ErpNextV1DocumentGetNode } from './operation_get';
import type { ErpNextV1DocumentGetAllNode } from './operation_get_all';
import type { ErpNextV1DocumentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ErpNextV1DocumentNode =
  | ErpNextV1DocumentCreateNode
  | ErpNextV1DocumentDeleteNode
  | ErpNextV1DocumentGetNode
  | ErpNextV1DocumentGetAllNode
  | ErpNextV1DocumentUpdateNode
  ;