/**
 * QuickBooks Online - Payment Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbooksV1PaymentCreateNode } from './operation_create';
import type { QuickbooksV1PaymentDeleteNode } from './operation_delete';
import type { QuickbooksV1PaymentGetNode } from './operation_get';
import type { QuickbooksV1PaymentGetAllNode } from './operation_get_all';
import type { QuickbooksV1PaymentSendNode } from './operation_send';
import type { QuickbooksV1PaymentUpdateNode } from './operation_update';
import type { QuickbooksV1PaymentVoidNode } from './operation_void';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_send';
export * from './operation_update';
export * from './operation_void';

export type QuickbooksV1PaymentNode =
  | QuickbooksV1PaymentCreateNode
  | QuickbooksV1PaymentDeleteNode
  | QuickbooksV1PaymentGetNode
  | QuickbooksV1PaymentGetAllNode
  | QuickbooksV1PaymentSendNode
  | QuickbooksV1PaymentUpdateNode
  | QuickbooksV1PaymentVoidNode
  ;