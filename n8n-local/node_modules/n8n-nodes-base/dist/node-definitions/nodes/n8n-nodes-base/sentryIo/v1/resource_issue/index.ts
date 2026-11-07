/**
 * Sentry.io - Issue Resource
 * Re-exports all operation types for this resource.
 */

import type { SentryIoV1IssueDeleteNode } from './operation_delete';
import type { SentryIoV1IssueGetNode } from './operation_get';
import type { SentryIoV1IssueGetAllNode } from './operation_get_all';
import type { SentryIoV1IssueUpdateNode } from './operation_update';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SentryIoV1IssueNode =
  | SentryIoV1IssueDeleteNode
  | SentryIoV1IssueGetNode
  | SentryIoV1IssueGetAllNode
  | SentryIoV1IssueUpdateNode
  ;