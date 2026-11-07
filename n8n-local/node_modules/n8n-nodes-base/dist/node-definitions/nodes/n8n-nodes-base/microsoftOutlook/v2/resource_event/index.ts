/**
 * Microsoft Outlook - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2EventCreateNode } from './operation_create';
import type { MicrosoftOutlookV2EventDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV2EventGetNode } from './operation_get';
import type { MicrosoftOutlookV2EventGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV2EventUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftOutlookV2EventNode =
  | MicrosoftOutlookV2EventCreateNode
  | MicrosoftOutlookV2EventDeleteNode
  | MicrosoftOutlookV2EventGetNode
  | MicrosoftOutlookV2EventGetAllNode
  | MicrosoftOutlookV2EventUpdateNode
  ;