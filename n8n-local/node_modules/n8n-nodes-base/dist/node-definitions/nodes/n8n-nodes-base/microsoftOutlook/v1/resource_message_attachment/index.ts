/**
 * Microsoft Outlook - MessageAttachment Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV1MessageAttachmentAddNode } from './operation_add';
import type { MicrosoftOutlookV1MessageAttachmentDownloadNode } from './operation_download';
import type { MicrosoftOutlookV1MessageAttachmentGetNode } from './operation_get';
import type { MicrosoftOutlookV1MessageAttachmentGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_download';
export * from './operation_get';
export * from './operation_get_all';

export type MicrosoftOutlookV1MessageAttachmentNode =
  | MicrosoftOutlookV1MessageAttachmentAddNode
  | MicrosoftOutlookV1MessageAttachmentDownloadNode
  | MicrosoftOutlookV1MessageAttachmentGetNode
  | MicrosoftOutlookV1MessageAttachmentGetAllNode
  ;