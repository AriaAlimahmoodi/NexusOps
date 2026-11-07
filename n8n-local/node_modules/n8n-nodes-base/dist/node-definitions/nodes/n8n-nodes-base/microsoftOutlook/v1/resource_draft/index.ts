/**
 * Microsoft Outlook - Draft Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV1DraftCreateNode } from './operation_create';
import type { MicrosoftOutlookV1DraftDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV1DraftGetNode } from './operation_get';
import type { MicrosoftOutlookV1DraftSendNode } from './operation_send';
import type { MicrosoftOutlookV1DraftUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_send';
export * from './operation_update';

export type MicrosoftOutlookV1DraftNode =
  | MicrosoftOutlookV1DraftCreateNode
  | MicrosoftOutlookV1DraftDeleteNode
  | MicrosoftOutlookV1DraftGetNode
  | MicrosoftOutlookV1DraftSendNode
  | MicrosoftOutlookV1DraftUpdateNode
  ;