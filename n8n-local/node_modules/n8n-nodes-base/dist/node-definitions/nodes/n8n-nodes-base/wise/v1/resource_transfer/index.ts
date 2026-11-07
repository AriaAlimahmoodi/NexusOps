/**
 * Wise - Transfer Resource
 * Re-exports all operation types for this resource.
 */

import type { WiseV1TransferCreateNode } from './operation_create';
import type { WiseV1TransferDeleteNode } from './operation_delete';
import type { WiseV1TransferExecuteNode } from './operation_execute';
import type { WiseV1TransferGetNode } from './operation_get';
import type { WiseV1TransferGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_execute';
export * from './operation_get';
export * from './operation_get_all';

export type WiseV1TransferNode =
  | WiseV1TransferCreateNode
  | WiseV1TransferDeleteNode
  | WiseV1TransferExecuteNode
  | WiseV1TransferGetNode
  | WiseV1TransferGetAllNode
  ;