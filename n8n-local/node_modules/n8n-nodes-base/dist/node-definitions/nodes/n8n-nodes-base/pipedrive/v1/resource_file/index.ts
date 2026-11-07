/**
 * Pipedrive - File Resource
 * Re-exports all operation types for this resource.
 */

import type { PipedriveV1FileCreateNode } from './operation_create';
import type { PipedriveV1FileDeleteNode } from './operation_delete';
import type { PipedriveV1FileDownloadNode } from './operation_download';
import type { PipedriveV1FileGetNode } from './operation_get';
import type { PipedriveV1FileUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_download';
export * from './operation_get';
export * from './operation_update';

export type PipedriveV1FileNode =
  | PipedriveV1FileCreateNode
  | PipedriveV1FileDeleteNode
  | PipedriveV1FileDownloadNode
  | PipedriveV1FileGetNode
  | PipedriveV1FileUpdateNode
  ;