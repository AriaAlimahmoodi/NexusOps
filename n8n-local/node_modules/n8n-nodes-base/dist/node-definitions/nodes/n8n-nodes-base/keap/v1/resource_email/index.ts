/**
 * Keap - Email Resource
 * Re-exports all operation types for this resource.
 */

import type { KeapV1EmailCreateRecordNode } from './operation_create_record';
import type { KeapV1EmailGetAllNode } from './operation_get_all';
import type { KeapV1EmailSendNode } from './operation_send';

export * from './operation_create_record';
export * from './operation_get_all';
export * from './operation_send';

export type KeapV1EmailNode =
  | KeapV1EmailCreateRecordNode
  | KeapV1EmailGetAllNode
  | KeapV1EmailSendNode
  ;