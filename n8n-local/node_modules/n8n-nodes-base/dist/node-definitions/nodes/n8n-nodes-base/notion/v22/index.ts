/**
 * Notion Node - Version 2.2
 * Re-exports all discriminator combinations.
 */

import type { NotionV22BlockNode } from './resource_block';
import type { NotionV22DatabaseNode } from './resource_database';
import type { NotionV22DatabasePageNode } from './resource_database_page';
import type { NotionV22PageNode } from './resource_page';
import type { NotionV22UserNode } from './resource_user';

export * from './resource_block';
export * from './resource_database';
export * from './resource_database_page';
export * from './resource_page';
export * from './resource_user';

export type NotionV22Node =
  | NotionV22BlockNode
  | NotionV22DatabaseNode
  | NotionV22DatabasePageNode
  | NotionV22PageNode
  | NotionV22UserNode
  ;