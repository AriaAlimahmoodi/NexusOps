/**
 * SSH - File Resource
 * Re-exports all operation types for this resource.
 */

import type { SshV1FileDownloadNode } from './operation_download';
import type { SshV1FileUploadNode } from './operation_upload';

export * from './operation_download';
export * from './operation_upload';

export type SshV1FileNode =
  | SshV1FileDownloadNode
  | SshV1FileUploadNode
  ;