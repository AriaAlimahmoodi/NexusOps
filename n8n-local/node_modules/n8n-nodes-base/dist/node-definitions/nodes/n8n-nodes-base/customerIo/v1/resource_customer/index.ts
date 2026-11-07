/**
 * Customer.io - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { CustomerIoV1CustomerDeleteNode } from './operation_delete';
import type { CustomerIoV1CustomerUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_upsert';

export type CustomerIoV1CustomerNode =
  | CustomerIoV1CustomerDeleteNode
  | CustomerIoV1CustomerUpsertNode
  ;