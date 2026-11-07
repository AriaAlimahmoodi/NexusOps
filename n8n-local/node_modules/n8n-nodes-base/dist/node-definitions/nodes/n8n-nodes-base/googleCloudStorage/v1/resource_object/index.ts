/**
 * Google Cloud Storage - Object Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCloudStorageV1ObjectCreateNode } from './operation_create';
import type { GoogleCloudStorageV1ObjectDeleteNode } from './operation_delete';
import type { GoogleCloudStorageV1ObjectGetNode } from './operation_get';
import type { GoogleCloudStorageV1ObjectGetAllNode } from './operation_get_all';
import type { GoogleCloudStorageV1ObjectUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type GoogleCloudStorageV1ObjectNode =
  | GoogleCloudStorageV1ObjectCreateNode
  | GoogleCloudStorageV1ObjectDeleteNode
  | GoogleCloudStorageV1ObjectGetNode
  | GoogleCloudStorageV1ObjectGetAllNode
  | GoogleCloudStorageV1ObjectUpdateNode
  ;