/**
 * Microsoft Teams - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV11TaskCreateNode } from './operation_create';
import type { MicrosoftTeamsV11TaskDeleteNode } from './operation_delete';
import type { MicrosoftTeamsV11TaskGetNode } from './operation_get';
import type { MicrosoftTeamsV11TaskGetAllNode } from './operation_get_all';
import type { MicrosoftTeamsV11TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftTeamsV11TaskNode =
  | MicrosoftTeamsV11TaskCreateNode
  | MicrosoftTeamsV11TaskDeleteNode
  | MicrosoftTeamsV11TaskGetNode
  | MicrosoftTeamsV11TaskGetAllNode
  | MicrosoftTeamsV11TaskUpdateNode
  ;