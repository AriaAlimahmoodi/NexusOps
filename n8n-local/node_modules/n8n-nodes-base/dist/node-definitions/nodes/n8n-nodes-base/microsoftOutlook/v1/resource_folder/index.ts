/**
 * Microsoft Outlook - Folder Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV1FolderCreateNode } from './operation_create';
import type { MicrosoftOutlookV1FolderDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV1FolderGetNode } from './operation_get';
import type { MicrosoftOutlookV1FolderGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV1FolderGetChildrenNode } from './operation_get_children';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_get_children';

export type MicrosoftOutlookV1FolderNode =
  | MicrosoftOutlookV1FolderCreateNode
  | MicrosoftOutlookV1FolderDeleteNode
  | MicrosoftOutlookV1FolderGetNode
  | MicrosoftOutlookV1FolderGetAllNode
  | MicrosoftOutlookV1FolderGetChildrenNode
  ;