/**
 * Microsoft SharePoint - List Resource
 * Re-exports all operation types for this resource.
 */

import type { MicrosoftSharePointV1ListGetNode } from './operation_get';
import type { MicrosoftSharePointV1ListGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type MicrosoftSharePointV1ListNode =
  | MicrosoftSharePointV1ListGetNode
  | MicrosoftSharePointV1ListGetAllNode
  ;