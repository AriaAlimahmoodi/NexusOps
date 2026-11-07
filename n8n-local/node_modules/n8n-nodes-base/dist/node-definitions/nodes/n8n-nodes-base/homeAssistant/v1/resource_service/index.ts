/**
 * Home Assistant - Service Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1ServiceCallNode } from './operation_call';
import type { HomeAssistantV1ServiceGetAllNode } from './operation_get_all';

export * from './operation_call';
export * from './operation_get_all';

export type HomeAssistantV1ServiceNode =
  | HomeAssistantV1ServiceCallNode
  | HomeAssistantV1ServiceGetAllNode
  ;