/**
 * Google Calendar - Calendar Resource
 * Re-exports all operation types for this resource.
 */

import type { GoogleCalendarV1CalendarAvailabilityNode } from './operation_availability';

export * from './operation_availability';

export type GoogleCalendarV1CalendarNode = GoogleCalendarV1CalendarAvailabilityNode;