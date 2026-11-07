/**
 * PostHog - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { PostHogV1EventCreateNode } from './operation_create';

export * from './operation_create';

export type PostHogV1EventNode = PostHogV1EventCreateNode;