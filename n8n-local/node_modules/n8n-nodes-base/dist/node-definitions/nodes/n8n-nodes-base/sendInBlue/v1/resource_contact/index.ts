/**
 * Brevo - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { SendInBlueV1ContactCreateNode } from './operation_create';
import type { SendInBlueV1ContactDeleteNode } from './operation_delete';
import type { SendInBlueV1ContactGetNode } from './operation_get';
import type { SendInBlueV1ContactGetAllNode } from './operation_get_all';
import type { SendInBlueV1ContactUpdateNode } from './operation_update';
import type { SendInBlueV1ContactUpsertNode } from './operation_upsert';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_upsert';

export type SendInBlueV1ContactNode =
  | SendInBlueV1ContactCreateNode
  | SendInBlueV1ContactDeleteNode
  | SendInBlueV1ContactGetNode
  | SendInBlueV1ContactGetAllNode
  | SendInBlueV1ContactUpdateNode
  | SendInBlueV1ContactUpsertNode
  ;