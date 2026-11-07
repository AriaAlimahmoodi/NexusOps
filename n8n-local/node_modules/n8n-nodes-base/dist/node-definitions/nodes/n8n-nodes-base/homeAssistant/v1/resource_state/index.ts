/**
 * Home Assistant - State Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1StateGetNode } from './operation_get';
import type { HomeAssistantV1StateGetAllNode } from './operation_get_all';
import type { HomeAssistantV1StateUpsertNode } from './operation_upsert';

export * from './operation_get';
export * from './operation_get_all';
export * from './operation_upsert';

export type HomeAssistantV1StateNode =
  | HomeAssistantV1StateGetNode
  | HomeAssistantV1StateGetAllNode
  | HomeAssistantV1StateUpsertNode
  ;