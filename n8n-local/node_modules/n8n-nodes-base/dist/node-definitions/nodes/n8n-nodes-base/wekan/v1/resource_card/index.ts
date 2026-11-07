/**
 * Wekan - Card Resource
 * Re-exports all operation types for this resource.
 */

import type { WekanV1CardCreateNode } from './operation_create';
import type { WekanV1CardDeleteNode } from './operation_delete';
import type { WekanV1CardGetNode } from './operation_get';
import type { WekanV1CardGetAllNode } from './operation_get_all';
import type { WekanV1CardUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type WekanV1CardNode =
  | WekanV1CardCreateNode
  | WekanV1CardDeleteNode
  | WekanV1CardGetNode
  | WekanV1CardGetAllNode
  | WekanV1CardUpdateNode
  ;