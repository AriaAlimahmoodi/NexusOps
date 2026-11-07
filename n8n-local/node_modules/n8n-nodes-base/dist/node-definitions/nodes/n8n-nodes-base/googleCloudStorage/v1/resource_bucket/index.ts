/**
 * Google Cloud Storage - Bucket Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCloudStorageV1BucketCreateNode } from './operation_create';
import type { GoogleCloudStorageV1BucketDeleteNode } from './operation_delete';
import type { GoogleCloudStorageV1BucketGetNode } from './operation_get';
import type { GoogleCloudStorageV1BucketGetAllNode } from './operation_get_all';
import type { GoogleCloudStorageV1BucketUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleCloudStorageV1BucketNode =
  | GoogleCloudStorageV1BucketCreateNode
  | GoogleCloudStorageV1BucketDeleteNode
  | GoogleCloudStorageV1BucketGetNode
  | GoogleCloudStorageV1BucketGetAllNode
  | GoogleCloudStorageV1BucketUpdateNode
  ;