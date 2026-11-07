/**
 * PostHog - Identity Resource
 * Re-exports all operation types for this resource.
 */

import type { PostHogV1IdentityCreateNode } from './operation_create';

export * from './operation_create';

export type PostHogV1IdentityNode = PostHogV1IdentityCreateNode;