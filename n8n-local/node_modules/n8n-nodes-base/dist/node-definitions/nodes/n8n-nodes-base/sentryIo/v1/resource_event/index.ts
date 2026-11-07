/**
 * Sentry.io - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { SentryIoV1EventGetNode } from './operation_get';
import type { SentryIoV1EventGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type SentryIoV1EventNode =
  | SentryIoV1EventGetNode
  | SentryIoV1EventGetAllNode
  ;