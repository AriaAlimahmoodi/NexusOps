/**
 * Notion Node - Version 2
 * Re-exports all discriminator combinations.
 */

import type { NotionV2BlockNode } from './resource_block';
import type { NotionV2DatabaseNode } from './resource_database';
import type { NotionV2DatabasePageNode } from './resource_database_page';
import type { NotionV2PageNode } from './resource_page';
import type { NotionV2UserNode } from './resource_user';

export * from './resource_block';
export * from './resource_database';
export * from './resource_database_page';
export * from './resource_page';
export * from './resource_user';

export type NotionV2Node =
  | NotionV2BlockNode
  | NotionV2DatabaseNode
  | NotionV2DatabasePageNode
  | NotionV2PageNode
  | NotionV2UserNode
  ;