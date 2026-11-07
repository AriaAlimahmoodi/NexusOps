/**
 * Taiga - UserStory Resource
 * Re-exports all operation types for this resource.
 */

import type { TaigaV1UserStoryCreateNode } from './operation_create';
import type { TaigaV1UserStoryDeleteNode } from './operation_delete';
import type { TaigaV1UserStoryGetNode } from './operation_get';
import type { TaigaV1UserStoryGetAllNode } from './operation_get_all';
import type { TaigaV1UserStoryUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type TaigaV1UserStoryNode =
  | TaigaV1UserStoryCreateNode
  | TaigaV1UserStoryDeleteNode
  | TaigaV1UserStoryGetNode
  | TaigaV1UserStoryGetAllNode
  | TaigaV1UserStoryUpdateNode
  ;