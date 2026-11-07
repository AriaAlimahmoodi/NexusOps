/**
 * Google Drive - Drive Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV3DriveCreateNode } from './operation_create';
import type { GoogleDriveV3DriveDeleteDriveNode } from './operation_delete_drive';
import type { GoogleDriveV3DriveGetNode } from './operation_get';
import type { GoogleDriveV3DriveListNode } from './operation_list';
import type { GoogleDriveV3DriveUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_drive';
export * from './operation_get';
export * from './operation_list';
export * from './operation_update';

export type GoogleDriveV3DriveNode =
  | GoogleDriveV3DriveCreateNode
  | GoogleDriveV3DriveDeleteDriveNode
  | GoogleDriveV3DriveGetNode
  | GoogleDriveV3DriveListNode
  | GoogleDriveV3DriveUpdateNode
  ;