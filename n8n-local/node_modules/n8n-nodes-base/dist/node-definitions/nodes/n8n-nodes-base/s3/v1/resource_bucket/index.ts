/**
 * S3 - Bucket Resource
 * Re-exports all operation types for this resource.
 */

import type { S3V1BucketCreateNode } from './operation_create';
import type { S3V1BucketDeleteNode } from './operation_delete';
import type { S3V1BucketGetAllNode } from './operation_get_all';
import type { S3V1BucketSearchNode } from './operation_search';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get_all';
export * from './operation_search';

export type S3V1BucketNode =
  | S3V1BucketCreateNode
  | S3V1BucketDeleteNode
  | S3V1BucketGetAllNode
  | S3V1BucketSearchNode
  ;