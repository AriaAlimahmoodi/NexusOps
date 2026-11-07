/**
 * PagerDuty Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PagerDutyV1IncidentNode } from './resource_incident';
import type { PagerDutyV1IncidentNoteNode } from './resource_incident_note';
import type { PagerDutyV1LogEntryNode } from './resource_log_entry';
import type { PagerDutyV1UserNode } from './resource_user';

export * from './resource_incident';
export * from './resource_incident_note';
export * from './resource_log_entry';
export * from './resource_user';

export type PagerDutyV1Node =
  | PagerDutyV1IncidentNode
  | PagerDutyV1IncidentNoteNode
  | PagerDutyV1LogEntryNode
  | PagerDutyV1UserNode
  ;