/**
 * Sentry.io - Project Resource
 * Re-exports all operation types for this resource.
 */

import type { SentryIoV1ProjectCreateNode } from './operation_create';
import type { SentryIoV1ProjectDeleteNode } from './operation_delete';
import type { SentryIoV1ProjectGetNode } from './operation_get';
import type { SentryIoV1ProjectGetAllNode } from './operation_get_all';
import type { SentryIoV1ProjectUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SentryIoV1ProjectNode =
  | SentryIoV1ProjectCreateNode
  | SentryIoV1ProjectDeleteNode
  | SentryIoV1ProjectGetNode
  | SentryIoV1ProjectGetAllNode
  | SentryIoV1ProjectUpdateNode
  ;