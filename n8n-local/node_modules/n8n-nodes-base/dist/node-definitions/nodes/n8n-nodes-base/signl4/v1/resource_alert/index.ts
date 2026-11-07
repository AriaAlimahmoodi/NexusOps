/**
 * SIGNL4 - Alert Resource
 * Re-exports all operation types for this resource.
 */

import type { Signl4V1AlertResolveNode } from './operation_resolve';
import type { Signl4V1AlertSendNode } from './operation_send';

export * from './operation_resolve';
export * from './operation_send';

export type Signl4V1AlertNode =
  | Signl4V1AlertResolveNode
  | Signl4V1AlertSendNode
  ;