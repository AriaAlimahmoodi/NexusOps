/**
 * GoToWebinar Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GoToWebinarV1AttendeeNode } from './resource_attendee';
import type { GoToWebinarV1CoorganizerNode } from './resource_coorganizer';
import type { GoToWebinarV1PanelistNode } from './resource_panelist';
import type { GoToWebinarV1RegistrantNode } from './resource_registrant';
import type { GoToWebinarV1SessionNode } from './resource_session';
import type { GoToWebinarV1WebinarNode } from './resource_webinar';

export * from './resource_attendee';
export * from './resource_coorganizer';
export * from './resource_panelist';
export * from './resource_registrant';
export * from './resource_session';
export * from './resource_webinar';

export type GoToWebinarV1Node =
  | GoToWebinarV1AttendeeNode
  | GoToWebinarV1CoorganizerNode
  | GoToWebinarV1PanelistNode
  | GoToWebinarV1RegistrantNode
  | GoToWebinarV1SessionNode
  | GoToWebinarV1WebinarNode
  ;