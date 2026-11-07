/**
 * ConvertKit - Tag Resource
 * Re-exports all operation types for this resource.
 */

import type { ConvertKitV1TagCreateNode } from './operation_create';
import type { ConvertKitV1TagGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type ConvertKitV1TagNode =
  | ConvertKitV1TagCreateNode
  | ConvertKitV1TagGetAllNode
  ;