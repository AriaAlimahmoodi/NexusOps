/**
 * Microsoft Outlook - Draft Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2DraftCreateNode } from './operation_create';
import type { MicrosoftOutlookV2DraftDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV2DraftGetNode } from './operation_get';
import type { MicrosoftOutlookV2DraftSendNode } from './operation_send';
import type { MicrosoftOutlookV2DraftUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_send';
export * from './operation_update';

export type MicrosoftOutlookV2DraftNode =
  | MicrosoftOutlookV2DraftCreateNode
  | MicrosoftOutlookV2DraftDeleteNode
  | MicrosoftOutlookV2DraftGetNode
  | MicrosoftOutlookV2DraftSendNode
  | MicrosoftOutlookV2DraftUpdateNode
  ;