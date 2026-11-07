/**
 * Brevo - Attribute Resource
 * Re-exports all operation types for this resource.
 */

import type { SendInBlueV1AttributeCreateNode } from './operation_create';
import type { SendInBlueV1AttributeDeleteNode } from './operation_delete';
import type { SendInBlueV1AttributeGetAllNode } from './operation_get_all';
import type { SendInBlueV1AttributeUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_update';

export type SendInBlueV1AttributeNode =
  | SendInBlueV1AttributeCreateNode
  | SendInBlueV1AttributeDeleteNode
  | SendInBlueV1AttributeGetAllNode
  | SendInBlueV1AttributeUpdateNode
  ;