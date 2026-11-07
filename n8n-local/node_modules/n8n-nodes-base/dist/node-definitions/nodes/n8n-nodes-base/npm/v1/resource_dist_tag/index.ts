/**
 * Npm - DistTag Resource
 * Re-exports all operation types for this resource.
 */

import type { NpmV1DistTagGetManyNode } from './operation_get_many';
import type { NpmV1DistTagUpdateNode } from './operation_update';

export * from './operation_get_many';
export * from './operation_update';

export type NpmV1DistTagNode =
  | NpmV1DistTagGetManyNode
  | NpmV1DistTagUpdateNode
  ;