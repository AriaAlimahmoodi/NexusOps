/**
 * Microsoft Teams - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV2ChannelCreateNode } from './operation_create';
import type { MicrosoftTeamsV2ChannelDeleteChannelNode } from './operation_delete_channel';
import type { MicrosoftTeamsV2ChannelGetNode } from './operation_get';
import type { MicrosoftTeamsV2ChannelGetAllNode } from './operation_get_all';
import type { MicrosoftTeamsV2ChannelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete_channel';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftTeamsV2ChannelNode =
  | MicrosoftTeamsV2ChannelCreateNode
  | MicrosoftTeamsV2ChannelDeleteChannelNode
  | MicrosoftTeamsV2ChannelGetNode
  | MicrosoftTeamsV2ChannelGetAllNode
  | MicrosoftTeamsV2ChannelUpdateNode
  ;