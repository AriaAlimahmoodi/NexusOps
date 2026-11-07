/**
 * SendGrid - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { SendGridV1ContactDeleteNode } from './operation_delete';
import type { SendGridV1ContactGetNode } from './operation_get';
import type { SendGridV1ContactGetAllNode } from './operation_get_all';
import type { SendGridV1ContactUpsertNode } from './operation_upsert';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upsert';

export type SendGridV1ContactNode =
  | SendGridV1ContactDeleteNode
  | SendGridV1ContactGetNode
  | SendGridV1ContactGetAllNode
  | SendGridV1ContactUpsertNode
  ;