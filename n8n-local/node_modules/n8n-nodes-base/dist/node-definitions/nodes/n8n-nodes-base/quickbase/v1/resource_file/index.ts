/**
 * Quick Base - File Resource
 * Re-exports all operation types for this resource.
 */

import type { QuickbaseV1FileDeleteNode } from './operation_delete';
import type { QuickbaseV1FileDownloadNode } from './operation_download';

export * from './operation_delete';
export * from './operation_download';

export type QuickbaseV1FileNode =
  | QuickbaseV1FileDeleteNode
  | QuickbaseV1FileDownloadNode
  ;