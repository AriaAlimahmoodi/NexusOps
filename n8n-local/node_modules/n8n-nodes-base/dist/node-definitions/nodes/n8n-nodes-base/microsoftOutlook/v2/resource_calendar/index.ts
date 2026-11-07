/**
 * Microsoft Outlook - Calendar Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2CalendarCreateNode } from './operation_create';
import type { MicrosoftOutlookV2CalendarDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV2CalendarGetNode } from './operation_get';
import type { MicrosoftOutlookV2CalendarGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV2CalendarUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftOutlookV2CalendarNode =
  | MicrosoftOutlookV2CalendarCreateNode
  | MicrosoftOutlookV2CalendarDeleteNode
  | MicrosoftOutlookV2CalendarGetNode
  | MicrosoftOutlookV2CalendarGetAllNode
  | MicrosoftOutlookV2CalendarUpdateNode
  ;