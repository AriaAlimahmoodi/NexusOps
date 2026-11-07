/**
 * GetResponse - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { GetResponseV1ContactCreateNode } from './operation_create';
import type { GetResponseV1ContactDeleteNode } from './operation_delete';
import type { GetResponseV1ContactGetNode } from './operation_get';
import type { GetResponseV1ContactGetAllNode } from './operation_get_all';
import type { GetResponseV1ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GetResponseV1ContactNode =
  | GetResponseV1ContactCreateNode
  | GetResponseV1ContactDeleteNode
  | GetResponseV1ContactGetNode
  | GetResponseV1ContactGetAllNode
  | GetResponseV1ContactUpdateNode
  ;