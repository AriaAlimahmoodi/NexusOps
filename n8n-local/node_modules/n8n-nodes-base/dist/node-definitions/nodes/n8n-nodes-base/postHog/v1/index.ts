/**
 * PostHog Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PostHogV1AliasNode } from './resource_alias';
import type { PostHogV1EventNode } from './resource_event';
import type { PostHogV1IdentityNode } from './resource_identity';
import type { PostHogV1TrackNode } from './resource_track';

export * from './resource_alias';
export * from './resource_event';
export * from './resource_identity';
export * from './resource_track';

export type PostHogV1Node =
  | PostHogV1AliasNode
  | PostHogV1EventNode
  | PostHogV1IdentityNode
  | PostHogV1TrackNode
  ;