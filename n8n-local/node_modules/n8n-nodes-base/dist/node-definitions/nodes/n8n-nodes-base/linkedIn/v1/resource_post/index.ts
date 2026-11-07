/**
 * LinkedIn - Post Resource
 * Re-exports all operation types for this resource.
 */

import type { LinkedInV1PostCreateNode } from './operation_create';

export * from './operation_create';

export type LinkedInV1PostNode = LinkedInV1PostCreateNode;