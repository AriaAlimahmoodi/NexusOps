/**
 * Contentful - Space Resource
 * Re-exports all operation types for this resource.
 */

import type { ContentfulV1SpaceGetNode } from './operation_get';

export * from './operation_get';

export type ContentfulV1SpaceNode = ContentfulV1SpaceGetNode;