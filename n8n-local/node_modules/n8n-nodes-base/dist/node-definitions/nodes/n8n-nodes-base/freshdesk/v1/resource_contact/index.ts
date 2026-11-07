/**
 * Freshdesk - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshdeskV1ContactCreateNode } from './operation_create';
import type { FreshdeskV1ContactDeleteNode } from './operation_delete';
import type { FreshdeskV1ContactGetNode } from './operation_get';
import type { FreshdeskV1ContactGetAllNode } from './operation_get_all';
import type { FreshdeskV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshdeskV1ContactNode =
  | FreshdeskV1ContactCreateNode
  | FreshdeskV1ContactDeleteNode
  | FreshdeskV1ContactGetNode
  | FreshdeskV1ContactGetAllNode
  | FreshdeskV1ContactUpdateNode
  ;