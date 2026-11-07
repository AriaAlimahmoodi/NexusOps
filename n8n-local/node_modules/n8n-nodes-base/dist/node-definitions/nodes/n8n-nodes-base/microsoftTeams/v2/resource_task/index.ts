/**
 * Microsoft Teams - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV2TaskCreateNode } from './operation_create';
import type { MicrosoftTeamsV2TaskDeleteTaskNode } from './operation_delete_task';
import type { MicrosoftTeamsV2TaskGetNode } from './operation_get';
import type { MicrosoftTeamsV2TaskGetAllNode } from './operation_get_all';
import type { MicrosoftTeamsV2TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_task';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftTeamsV2TaskNode =
  | MicrosoftTeamsV2TaskCreateNode
  | MicrosoftTeamsV2TaskDeleteTaskNode
  | MicrosoftTeamsV2TaskGetNode
  | MicrosoftTeamsV2TaskGetAllNode
  | MicrosoftTeamsV2TaskUpdateNode
  ;