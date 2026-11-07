/**
 * X (Formerly Twitter) - DirectMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { TwitterV1DirectMessageCreateNode } from './operation_create';

export * from './operation_create';

export type TwitterV1DirectMessageNode = TwitterV1DirectMessageCreateNode;