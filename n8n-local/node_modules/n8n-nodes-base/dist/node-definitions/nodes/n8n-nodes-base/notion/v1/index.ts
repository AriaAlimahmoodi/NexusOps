/**
 * Notion Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { NotionV1BlockNode } from './resource_block';
import type { NotionV1DatabaseNode } from './resource_database';
import type { NotionV1DatabasePageNode } from './resource_database_page';
import type { NotionV1PageNode } from './resource_page';
import type { NotionV1UserNode } from './resource_user';

export * from './resource_block';
export * from './resource_database';
export * from './resource_database_page';
export * from './resource_page';
export * from './resource_user';

export type NotionV1Node =
  | NotionV1BlockNode
  | NotionV1DatabaseNode
  | NotionV1DatabasePageNode
  | NotionV1PageNode
  | NotionV1UserNode
  ;