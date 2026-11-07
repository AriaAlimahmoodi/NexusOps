/**
 * Notion Node - Version 2.1
 * Re-exports all discriminator combinations.
 */

import type { NotionV21BlockNode } from './resource_block';
import type { NotionV21DatabaseNode } from './resource_database';
import type { NotionV21DatabasePageNode } from './resource_database_page';
import type { NotionV21PageNode } from './resource_page';
import type { NotionV21UserNode } from './resource_user';

export * from './resource_block';
export * from './resource_database';
export * from './resource_database_page';
export * from './resource_page';
export * from './resource_user';

export type NotionV21Node =
  | NotionV21BlockNode
  | NotionV21DatabaseNode
  | NotionV21DatabasePageNode
  | NotionV21PageNode
  | NotionV21UserNode
  ;