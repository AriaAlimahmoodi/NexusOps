/**
 * Slack - UserProfile Resource
 * Re-exports all operation types for this resource.
 */

import type { SlackV1UserProfileGetNode } from './operation_get';
import type { SlackV1UserProfileUpdateNode } from './operation_update';

export * from './operation_get';
export * from './operation_update';

export type SlackV1UserProfileNode =
  | SlackV1UserProfileGetNode
  | SlackV1UserProfileUpdateNode
  ;