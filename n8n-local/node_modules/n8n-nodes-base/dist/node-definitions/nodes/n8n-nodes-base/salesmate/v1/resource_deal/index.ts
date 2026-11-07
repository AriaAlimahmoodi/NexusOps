/**
 * Salesmate - Deal Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesmateV1DealCreateNode } from './operation_create';
import type { SalesmateV1DealDeleteNode } from './operation_delete';
import type { SalesmateV1DealGetNode } from './operation_get';
import type { SalesmateV1DealGetAllNode } from './operation_get_all';
import type { SalesmateV1DealUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SalesmateV1DealNode =
  | SalesmateV1DealCreateNode
  | SalesmateV1DealDeleteNode
  | SalesmateV1DealGetNode
  | SalesmateV1DealGetAllNode
  | SalesmateV1DealUpdateNode
  ;