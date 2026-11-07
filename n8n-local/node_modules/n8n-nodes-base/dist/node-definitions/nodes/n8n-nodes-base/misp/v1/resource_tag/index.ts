/**
 * MISP - Tag Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1TagCreateNode } from './operation_create';
import type { MispV1TagDeleteNode } from './operation_delete';
import type { MispV1TagGetAllNode } from './operation_get_all';
import type { MispV1TagUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type MispV1TagNode =
  | MispV1TagCreateNode
  | MispV1TagDeleteNode
  | MispV1TagGetAllNode
  | MispV1TagUpdateNode
  ;