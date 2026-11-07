/**
 * Microsoft Teams - ChatMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV1ChatMessageCreateNode } from './operation_create';
import type { MicrosoftTeamsV1ChatMessageGetNode } from './operation_get';
import type { MicrosoftTeamsV1ChatMessageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';

export type MicrosoftTeamsV1ChatMessageNode =
  | MicrosoftTeamsV1ChatMessageCreateNode
  | MicrosoftTeamsV1ChatMessageGetNode
  | MicrosoftTeamsV1ChatMessageGetAllNode
  ;