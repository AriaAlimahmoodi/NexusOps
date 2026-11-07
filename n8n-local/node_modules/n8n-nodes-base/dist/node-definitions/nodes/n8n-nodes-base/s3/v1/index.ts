/**
 * S3 Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { S3V1BucketNode } from './resource_bucket';
import type { S3V1FileNode } from './resource_file';
import type { S3V1FolderNode } from './resource_folder';

export * from './resource_bucket';
export * from './resource_file';
export * from './resource_folder';

export type S3V1Node =
  | S3V1BucketNode
  | S3V1FileNode
  | S3V1FolderNode
  ;