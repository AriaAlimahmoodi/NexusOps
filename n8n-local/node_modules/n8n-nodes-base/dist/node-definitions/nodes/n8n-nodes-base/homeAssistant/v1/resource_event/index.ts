/**
 * Home Assistant - Event Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1EventCreateNode } from './operation_create';
import type { HomeAssistantV1EventGetAllNode } from './operation_get_all';

export * from './operation_create';
export * from './operation_get_all';

export type HomeAssistantV1EventNode =
  | HomeAssistantV1EventCreateNode
  | HomeAssistantV1EventGetAllNode
  ;