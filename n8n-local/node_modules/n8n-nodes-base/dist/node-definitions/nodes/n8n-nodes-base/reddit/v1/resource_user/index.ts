/**
 * Reddit - User Resource
 * Re-exports all operation types for this resource.
 */

import type { RedditV1UserGetNode } from './operation_get';

export * from './operation_get';

export type RedditV1UserNode = RedditV1UserGetNode;