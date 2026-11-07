/**
 * Google Drive - FileFolder Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleDriveV3FileFolderSearchNode } from './operation_search';

export * from './operation_search';

export type GoogleDriveV3FileFolderNode = GoogleDriveV3FileFolderSearchNode;