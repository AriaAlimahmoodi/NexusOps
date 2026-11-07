/**
 * Google Drive - Drive Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV1DriveCreateNode } from './operation_create';
import type { GoogleDriveV1DriveDeleteNode } from './operation_delete';
import type { GoogleDriveV1DriveGetNode } from './operation_get';
import type { GoogleDriveV1DriveListNode } from './operation_list';
import type { GoogleDriveV1DriveUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_list';
export * from './operation_update';

export type GoogleDriveV1DriveNode =
  | GoogleDriveV1DriveCreateNode
  | GoogleDriveV1DriveDeleteNode
  | GoogleDriveV1DriveGetNode
  | GoogleDriveV1DriveListNode
  | GoogleDriveV1DriveUpdateNode
  ;