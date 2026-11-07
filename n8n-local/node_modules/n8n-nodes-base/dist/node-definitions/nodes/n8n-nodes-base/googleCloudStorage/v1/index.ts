/**
 * Google Cloud Storage Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoogleCloudStorageV1BucketNode } from './resource_bucket';
import type { GoogleCloudStorageV1ObjectNode } from './resource_object';

export * from './resource_bucket';
export * from './resource_object';

export type GoogleCloudStorageV1Node =
  | GoogleCloudStorageV1BucketNode
  | GoogleCloudStorageV1ObjectNode
  ;