/**
 * Microsoft Outlook - Contact Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftOutlookV2ContactCreateNode } from './operation_create';
import type { MicrosoftOutlookV2ContactDeleteNode } from './operation_delete';
import type { MicrosoftOutlookV2ContactGetNode } from './operation_get';
import type { MicrosoftOutlookV2ContactGetAllNode } from './operation_get_all';
import type { MicrosoftOutlookV2ContactUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MicrosoftOutlookV2ContactNode =
  | MicrosoftOutlookV2ContactCreateNode
  | MicrosoftOutlookV2ContactDeleteNode
  | MicrosoftOutlookV2ContactGetNode
  | MicrosoftOutlookV2ContactGetAllNode
  | MicrosoftOutlookV2ContactUpdateNode
  ;