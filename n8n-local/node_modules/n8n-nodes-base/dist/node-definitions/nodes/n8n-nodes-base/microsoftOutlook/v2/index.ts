/**
 * Microsoft Outlook Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftOutlookV2CalendarNode } from './resource_calendar';
import type { MicrosoftOutlookV2ContactNode } from './resource_contact';
import type { MicrosoftOutlookV2DraftNode } from './resource_draft';
import type { MicrosoftOutlookV2EventNode } from './resource_event';
import type { MicrosoftOutlookV2FolderNode } from './resource_folder';
import type { MicrosoftOutlookV2FolderMessageNode } from './resource_folder_message';
import type { MicrosoftOutlookV2MessageNode } from './resource_message';
import type { MicrosoftOutlookV2MessageAttachmentNode } from './resource_message_attachment';

export * from './resource_calendar';
export * from './resource_contact';
export * from './resource_draft';
export * from './resource_event';
export * from './resource_folder';
export * from './resource_folder_message';
export * from './resource_message';
export * from './resource_message_attachment';

export type MicrosoftOutlookV2Node =
  | MicrosoftOutlookV2CalendarNode
  | MicrosoftOutlookV2ContactNode
  | MicrosoftOutlookV2DraftNode
  | MicrosoftOutlookV2EventNode
  | MicrosoftOutlookV2FolderNode
  | MicrosoftOutlookV2FolderMessageNode
  | MicrosoftOutlookV2MessageNode
  | MicrosoftOutlookV2MessageAttachmentNode
  ;