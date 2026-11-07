/**
 * Drift - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { DriftV1ContactCreateNode } from './operation_create';
import type { DriftV1ContactDeleteNode } from './operation_delete';
import type { DriftV1ContactGetNode } from './operation_get';
import type { DriftV1ContactGetCustomAttributesNode } from './operation_get_custom_attributes';
import type { DriftV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_custom_attributes';
export * from './operation_update';

export type DriftV1ContactNode =
  | DriftV1ContactCreateNode
  | DriftV1ContactDeleteNode
  | DriftV1ContactGetNode
  | DriftV1ContactGetCustomAttributesNode
  | DriftV1ContactUpdateNode
  ;