/**
 * Microsoft Teams - ChannelMessage Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftTeamsV1ChannelMessageCreateNode } from './operation_create';
import type { MicrosoftTeamsV1ChannelMessageGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type MicrosoftTeamsV1ChannelMessageNode =
  | MicrosoftTeamsV1ChannelMessageCreateNode
  | MicrosoftTeamsV1ChannelMessageGetAllNode
  ;