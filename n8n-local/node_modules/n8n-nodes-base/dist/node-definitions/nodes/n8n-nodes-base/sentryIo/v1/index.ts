/**
 * Sentry.io Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SentryIoV1EventNode } from './resource_event';
import type { SentryIoV1IssueNode } from './resource_issue';
import type { SentryIoV1OrganizationNode } from './resource_organization';
import type { SentryIoV1ProjectNode } from './resource_project';
import type { SentryIoV1ReleaseNode } from './resource_release';
import type { SentryIoV1TeamNode } from './resource_team';

export * from './resource_event';
export * from './resource_issue';
export * from './resource_organization';
export * from './resource_project';
export * from './resource_release';
export * from './resource_team';

export type SentryIoV1Node =
  | SentryIoV1EventNode
  | SentryIoV1IssueNode
  | SentryIoV1OrganizationNode
  | SentryIoV1ProjectNode
  | SentryIoV1ReleaseNode
  | SentryIoV1TeamNode
  ;