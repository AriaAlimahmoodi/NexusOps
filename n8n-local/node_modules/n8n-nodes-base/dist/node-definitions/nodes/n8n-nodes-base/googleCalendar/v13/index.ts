/**
 * Google Calendar Node - Version 1.3
 * Re-exports all discriminator combinations.
 */

import type { GoogleCalendarV13CalendarNode } from './resource_calendar';
import type { GoogleCalendarV13EventNode } from './resource_event';

export * from './resource_calendar';
export * from './resource_event';

export type GoogleCalendarV13Node =
  | GoogleCalendarV13CalendarNode
  | GoogleCalendarV13EventNode
  ;