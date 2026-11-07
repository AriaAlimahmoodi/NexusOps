/**
 * Microsoft Teams - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV11ChannelCreateNode } from './operation_create';
import type { MicrosoftTeamsV11ChannelDeleteNode } from './operation_delete';
import type { MicrosoftTeamsV11ChannelGetNode } from './operation_get';
import type { MicrosoftTeamsV11ChannelGetAllNode } from './operation_get_all';
import type { MicrosoftTeamsV11ChannelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftTeamsV11ChannelNode =
  | MicrosoftTeamsV11ChannelCreateNode
  | MicrosoftTeamsV11ChannelDeleteNode
  | MicrosoftTeamsV11ChannelGetNode
  | MicrosoftTeamsV11ChannelGetAllNode
  | MicrosoftTeamsV11ChannelUpdateNode
  ;