/**
 * X (Formerly Twitter) - DirectMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { TwitterV2DirectMessageCreateNode } from './operation_create';

export * from './operation_create';

export type TwitterV2DirectMessageNode = TwitterV2DirectMessageCreateNode;