/**
 * ConvertKit - CustomField Resource
 * Re-exports all operation types for this resource.
 */

import type { ConvertKitV1CustomFieldCreateNode } from './operation_create';
import type { ConvertKitV1CustomFieldDeleteNode } from './operation_delete';
import type { ConvertKitV1CustomFieldGetAllNode } from './operation_get_all';
import type { ConvertKitV1CustomFieldUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type ConvertKitV1CustomFieldNode =
  | ConvertKitV1CustomFieldCreateNode
  | ConvertKitV1CustomFieldDeleteNode
  | ConvertKitV1CustomFieldGetAllNode
  | ConvertKitV1CustomFieldUpdateNode
  ;