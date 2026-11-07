/**
 * Microsoft Teams - ChannelMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV11ChannelMessageCreateNode } from './operation_create';
import type { MicrosoftTeamsV11ChannelMessageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type MicrosoftTeamsV11ChannelMessageNode =
  | MicrosoftTeamsV11ChannelMessageCreateNode
  | MicrosoftTeamsV11ChannelMessageGetAllNode
  ;