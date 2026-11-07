/**
 * Freshworks CRM Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { FreshworksCrmV1AccountNode } from './resource_account';
import type { FreshworksCrmV1AppointmentNode } from './resource_appointment';
import type { FreshworksCrmV1ContactNode } from './resource_contact';
import type { FreshworksCrmV1DealNode } from './resource_deal';
import type { FreshworksCrmV1NoteNode } from './resource_note';
import type { FreshworksCrmV1SalesActivityNode } from './resource_sales_activity';
import type { FreshworksCrmV1SearchNode } from './resource_search';
import type { FreshworksCrmV1TaskNode } from './resource_task';

export * from './resource_account';
export * from './resource_appointment';
export * from './resource_contact';
export * from './resource_deal';
export * from './resource_note';
export * from './resource_sales_activity';
export * from './resource_search';
export * from './resource_task';

export type FreshworksCrmV1Node =
  | FreshworksCrmV1AccountNode
  | FreshworksCrmV1AppointmentNode
  | FreshworksCrmV1ContactNode
  | FreshworksCrmV1DealNode
  | FreshworksCrmV1NoteNode
  | FreshworksCrmV1SalesActivityNode
  | FreshworksCrmV1SearchNode
  | FreshworksCrmV1TaskNode
  ;