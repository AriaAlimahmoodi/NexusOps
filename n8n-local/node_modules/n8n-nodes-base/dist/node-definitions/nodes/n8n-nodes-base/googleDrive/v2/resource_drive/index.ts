/**
 * Google Drive - Drive Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV2DriveCreateNode } from './operation_create';
import type { GoogleDriveV2DriveDeleteNode } from './operation_delete';
import type { GoogleDriveV2DriveGetNode } from './operation_get';
import type { GoogleDriveV2DriveListNode } from './operation_list';
import type { GoogleDriveV2DriveUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_list';
export * from './operation_update';

export type GoogleDriveV2DriveNode =
  | GoogleDriveV2DriveCreateNode
  | GoogleDriveV2DriveDeleteNode
  | GoogleDriveV2DriveGetNode
  | GoogleDriveV2DriveListNode
  | GoogleDriveV2DriveUpdateNode
  ;