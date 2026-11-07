/**
 * Xero - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { XeroV1ContactCreateNode } from './operation_create';
import type { XeroV1ContactGetNode } from './operation_get';
import type { XeroV1ContactGetAllNode } from './operation_get_all';
import type { XeroV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type XeroV1ContactNode =
  | XeroV1ContactCreateNode
  | XeroV1ContactGetNode
  | XeroV1ContactGetAllNode
  | XeroV1ContactUpdateNode
  ;