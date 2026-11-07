/**
 * Brevo - Sender Resource
 * Re-exports all operation types for this resource.
 */

import type { SendInBlueV1SenderCreateNode } from './operation_create';
import type { SendInBlueV1SenderDeleteNode } from './operation_delete';
import type { SendInBlueV1SenderGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';

export type SendInBlueV1SenderNode =
  | SendInBlueV1SenderCreateNode
  | SendInBlueV1SenderDeleteNode
  | SendInBlueV1SenderGetAllNode
  ;