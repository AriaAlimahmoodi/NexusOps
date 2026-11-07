/**
 * Home Assistant - Config Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1ConfigCheckNode } from './operation_check';
import type { HomeAssistantV1ConfigGetNode } from './operation_get';

export * from './operation_check';
export * from './operation_get';

export type HomeAssistantV1ConfigNode =
  | HomeAssistantV1ConfigCheckNode
  | HomeAssistantV1ConfigGetNode
  ;