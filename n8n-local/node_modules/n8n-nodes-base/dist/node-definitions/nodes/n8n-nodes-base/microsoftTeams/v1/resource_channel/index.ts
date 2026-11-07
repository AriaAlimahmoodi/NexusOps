/**
 * Microsoft Teams - Channel Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV1ChannelCreateNode } from './operation_create';
import type { MicrosoftTeamsV1ChannelDeleteNode } from './operation_delete';
import type { MicrosoftTeamsV1ChannelGetNode } from './operation_get';
import type { MicrosoftTeamsV1ChannelGetAllNode } from './operation_get_all';
import type { MicrosoftTeamsV1ChannelUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftTeamsV1ChannelNode =
  | MicrosoftTeamsV1ChannelCreateNode
  | MicrosoftTeamsV1ChannelDeleteNode
  | MicrosoftTeamsV1ChannelGetNode
  | MicrosoftTeamsV1ChannelGetAllNode
  | MicrosoftTeamsV1ChannelUpdateNode
  ;