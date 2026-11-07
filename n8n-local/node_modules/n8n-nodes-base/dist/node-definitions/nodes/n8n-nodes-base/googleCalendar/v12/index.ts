/**
 * Google Calendar Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { GoogleCalendarV12CalendarNode } from './resource_calendar';
import type { GoogleCalendarV12EventNode } from './resource_event';

export * from './resource_calendar';
export * from './resource_event';

export type GoogleCalendarV12Node =
  | GoogleCalendarV12CalendarNode
  | GoogleCalendarV12EventNode
  ;