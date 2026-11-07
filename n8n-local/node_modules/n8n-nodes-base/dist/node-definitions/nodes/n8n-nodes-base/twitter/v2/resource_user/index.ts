/**
 * X (Formerly Twitter) - User Resource
 * Re-exports all operation types for this resource.
 */

import type { TwitterV2UserSearchUserNode } from './operation_search_user';

export * from './operation_search_user';

export type TwitterV2UserNode = TwitterV2UserSearchUserNode;