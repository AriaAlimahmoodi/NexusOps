/**
 * Microsoft SharePoint Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftSharePointV1FileNode } from './resource_file';
import type { MicrosoftSharePointV1ItemNode } from './resource_item';
import type { MicrosoftSharePointV1ListNode } from './resource_list';

export * from './resource_file';
export * from './resource_item';
export * from './resource_list';

export type MicrosoftSharePointV1Node =
  | MicrosoftSharePointV1FileNode
  | MicrosoftSharePointV1ItemNode
  | MicrosoftSharePointV1ListNode
  ;