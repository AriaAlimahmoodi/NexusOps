/**
 * Contentful - ContentType Resource
 * Re-exports all operation types for this resource.
 */

import type { ContentfulV1ContentTypeGetNode } from './operation_get';

export * from './operation_get';

export type ContentfulV1ContentTypeNode = ContentfulV1ContentTypeGetNode;