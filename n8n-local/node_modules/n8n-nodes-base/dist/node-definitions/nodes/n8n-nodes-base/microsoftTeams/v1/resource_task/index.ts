/**
 * Microsoft Teams - Task Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV1TaskCreateNode } from './operation_create';
import type { MicrosoftTeamsV1TaskDeleteNode } from './operation_delete';
import type { MicrosoftTeamsV1TaskGetNode } from './operation_get';
import type { MicrosoftTeamsV1TaskGetAllNode } from './operation_get_all';
import type { MicrosoftTeamsV1TaskUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftTeamsV1TaskNode =
  | MicrosoftTeamsV1TaskCreateNode
  | MicrosoftTeamsV1TaskDeleteNode
  | MicrosoftTeamsV1TaskGetNode
  | MicrosoftTeamsV1TaskGetAllNode
  | MicrosoftTeamsV1TaskUpdateNode
  ;