/**
 * PostHog - Alias Resource
 * Re-exports all operation types for this resource.
 */

import type { PostHogV1AliasCreateNode } from './operation_create';

export * from './operation_create';

export type PostHogV1AliasNode = PostHogV1AliasCreateNode;