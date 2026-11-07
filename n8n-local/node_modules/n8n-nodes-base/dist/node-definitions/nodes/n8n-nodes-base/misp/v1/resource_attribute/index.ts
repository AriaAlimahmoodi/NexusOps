/**
 * MISP - Attribute Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1AttributeCreateNode } from './operation_create';
import type { MispV1AttributeDeleteNode } from './operation_delete';
import type { MispV1AttributeGetNode } from './operation_get';
import type { MispV1AttributeGetAllNode } from './operation_get_all';
import type { MispV1AttributeSearchNode } from './operation_search';
import type { MispV1AttributeUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_search';
export * from './operation_update';

export type MispV1AttributeNode =
  | MispV1AttributeCreateNode
  | MispV1AttributeDeleteNode
  | MispV1AttributeGetNode
  | MispV1AttributeGetAllNode
  | MispV1AttributeSearchNode
  | MispV1AttributeUpdateNode
  ;