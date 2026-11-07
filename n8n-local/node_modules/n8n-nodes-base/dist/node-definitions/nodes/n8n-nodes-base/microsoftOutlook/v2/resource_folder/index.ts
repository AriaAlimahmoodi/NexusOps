/**
 * Microsoft Outlook - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2FolderCreateNode } from './operation_create';
import type { MicrosoftOutlookV2FolderDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV2FolderGetNode } from './operation_get';
import type { MicrosoftOutlookV2FolderGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV2FolderUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftOutlookV2FolderNode =
  | MicrosoftOutlookV2FolderCreateNode
  | MicrosoftOutlookV2FolderDeleteNode
  | MicrosoftOutlookV2FolderGetNode
  | MicrosoftOutlookV2FolderGetAllNode
  | MicrosoftOutlookV2FolderUpdateNode
  ;