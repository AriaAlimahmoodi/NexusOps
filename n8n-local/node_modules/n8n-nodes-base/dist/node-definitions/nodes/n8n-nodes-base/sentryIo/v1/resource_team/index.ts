/**
 * Sentry.io - Team Resource
 * Re-exports all operation types for this resource.
 */

import type { SentryIoV1TeamCreateNode } from './operation_create';
import type { SentryIoV1TeamDeleteNode } from './operation_delete';
import type { SentryIoV1TeamGetNode } from './operation_get';
import type { SentryIoV1TeamGetAllNode } from './operation_get_all';
import type { SentryIoV1TeamUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SentryIoV1TeamNode =
  | SentryIoV1TeamCreateNode
  | SentryIoV1TeamDeleteNode
  | SentryIoV1TeamGetNode
  | SentryIoV1TeamGetAllNode
  | SentryIoV1TeamUpdateNode
  ;