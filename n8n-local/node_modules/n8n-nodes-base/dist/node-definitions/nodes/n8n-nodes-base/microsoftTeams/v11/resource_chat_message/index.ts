/**
 * Microsoft Teams - ChatMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV11ChatMessageCreateNode } from './operation_create';
import type { MicrosoftTeamsV11ChatMessageGetNode } from './operation_get';
import type { MicrosoftTeamsV11ChatMessageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';

export type MicrosoftTeamsV11ChatMessageNode =
  | MicrosoftTeamsV11ChatMessageCreateNode
  | MicrosoftTeamsV11ChatMessageGetNode
  | MicrosoftTeamsV11ChatMessageGetAllNode
  ;