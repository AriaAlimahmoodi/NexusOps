/**
 * SendGrid - List Resource
 * Re-exports all operation types for this resource.
 */

import type { SendGridV1ListCreateNode } from './operation_create';
import type { SendGridV1ListDeleteNode } from './operation_delete';
import type { SendGridV1ListGetNode } from './operation_get';
import type { SendGridV1ListGetAllNode } from './operation_get_all';
import type { SendGridV1ListUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SendGridV1ListNode =
  | SendGridV1ListCreateNode
  | SendGridV1ListDeleteNode
  | SendGridV1ListGetNode
  | SendGridV1ListGetAllNode
  | SendGridV1ListUpdateNode
  ;