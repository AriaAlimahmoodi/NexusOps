/**
 * Microsoft Outlook - MessageAttachment Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2MessageAttachmentAddNode } from './operation_add';
import type { MicrosoftOutlookV2MessageAttachmentDownloadNode } from './operation_download';
import type { MicrosoftOutlookV2MessageAttachmentGetNode } from './operation_get';
import type { MicrosoftOutlookV2MessageAttachmentGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_download';
export * from './operation_get';
export * from './operation_get_all';

export type MicrosoftOutlookV2MessageAttachmentNode =
  | MicrosoftOutlookV2MessageAttachmentAddNode
  | MicrosoftOutlookV2MessageAttachmentDownloadNode
  | MicrosoftOutlookV2MessageAttachmentGetNode
  | MicrosoftOutlookV2MessageAttachmentGetAllNode
  ;