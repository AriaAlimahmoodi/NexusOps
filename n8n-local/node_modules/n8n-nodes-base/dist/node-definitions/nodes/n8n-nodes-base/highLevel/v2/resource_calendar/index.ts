/**
 * HighLevel - Calendar Resource
 * Re-exports all operation types for this resource.
 */

import type { HighLevelV2CalendarBookAppointmentNode } from './operation_book_appointment';
import type { HighLevelV2CalendarGetFreeSlotsNode } from './operation_get_free_slots';

export * from './operation_book_appointment';
export * from './operation_get_free_slots';

export type HighLevelV2CalendarNode =
  | HighLevelV2CalendarBookAppointmentNode
  | HighLevelV2CalendarGetFreeSlotsNode
  ;