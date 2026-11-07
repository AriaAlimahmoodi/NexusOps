/**
 * Freshworks CRM - Appointment Resource
 * Re-exports all operation types for this resource.
 */

import type { FreshworksCrmV1AppointmentCreateNode } from './operation_create';
import type { FreshworksCrmV1AppointmentDeleteNode } from './operation_delete';
import type { FreshworksCrmV1AppointmentGetNode } from './operation_get';
import type { FreshworksCrmV1AppointmentGetAllNode } from './operation_get_all';
import type { FreshworksCrmV1AppointmentUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type FreshworksCrmV1AppointmentNode =
  | FreshworksCrmV1AppointmentCreateNode
  | FreshworksCrmV1AppointmentDeleteNode
  | FreshworksCrmV1AppointmentGetNode
  | FreshworksCrmV1AppointmentGetAllNode
  | FreshworksCrmV1AppointmentUpdateNode
  ;