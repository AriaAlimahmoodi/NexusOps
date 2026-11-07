/**
 * ServiceNow - Attachment Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1AttachmentDeleteNode } from './operation_delete';
import type { ServiceNowV1AttachmentGetNode } from './operation_get';
import type { ServiceNowV1AttachmentGetAllNode } from './operation_get_all';
import type { ServiceNowV1AttachmentUploadNode } from './operation_upload';

export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upload';

export type ServiceNowV1AttachmentNode =
  | ServiceNowV1AttachmentDeleteNode
  | ServiceNowV1AttachmentGetNode
  | ServiceNowV1AttachmentGetAllNode
  | ServiceNowV1AttachmentUploadNode
  ;