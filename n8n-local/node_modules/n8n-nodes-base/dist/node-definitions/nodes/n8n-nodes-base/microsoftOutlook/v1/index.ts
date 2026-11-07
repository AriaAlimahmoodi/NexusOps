/**
 * Microsoft Outlook Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftOutlookV1DraftNode } from './resource_draft';
import type { MicrosoftOutlookV1FolderNode } from './resource_folder';
import type { MicrosoftOutlookV1FolderMessageNode } from './resource_folder_message';
import type { MicrosoftOutlookV1MessageNode } from './resource_message';
import type { MicrosoftOutlookV1MessageAttachmentNode } from './resource_message_attachment';

export * from './resource_draft';
export * from './resource_folder';
export * from './resource_folder_message';
export * from './resource_message';
export * from './resource_message_attachment';

export type MicrosoftOutlookV1Node =
  | MicrosoftOutlookV1DraftNode
  | MicrosoftOutlookV1FolderNode
  | MicrosoftOutlookV1FolderMessageNode
  | MicrosoftOutlookV1MessageNode
  | MicrosoftOutlookV1MessageAttachmentNode
  ;