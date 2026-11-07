/**
 * Home Assistant - Log Resource
 * Re-exports all operation types for this resource.
 */

import type { HomeAssistantV1LogGetErroLogsNode } from './operation_get_erro_logs';
import type { HomeAssistantV1LogGetLogbookEntriesNode } from './operation_get_logbook_entries';

export * from './operation_get_erro_logs';
export * from './operation_get_logbook_entries';

export type HomeAssistantV1LogNode =
  | HomeAssistantV1LogGetErroLogsNode
  | HomeAssistantV1LogGetLogbookEntriesNode
  ;