/**
 * Microsoft SharePoint - File Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftSharePointV1FileDownloadNode } from './operation_download';
import type { MicrosoftSharePointV1FileUpdateNode } from './operation_update';
import type { MicrosoftSharePointV1FileUploadNode } from './operation_upload';

export * from './operation_download';
export * from './operation_update';
export * from './operation_upload';

export type MicrosoftSharePointV1FileNode =
  | MicrosoftSharePointV1FileDownloadNode
  | MicrosoftSharePointV1FileUpdateNode
  | MicrosoftSharePointV1FileUploadNode
  ;