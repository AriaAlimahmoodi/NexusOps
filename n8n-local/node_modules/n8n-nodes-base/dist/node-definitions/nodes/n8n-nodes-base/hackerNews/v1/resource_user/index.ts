/**
 * Hacker News - User Resource
 * Re-exports all operation types for this resource.
 */

import type { HackerNewsV1UserGetNode } from './operation_get';

export * from './operation_get';

export type HackerNewsV1UserNode = HackerNewsV1UserGetNode;