/**
 * ServiceNow - TableRecord Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1TableRecordCreateNode } from './operation_create';
import type { ServiceNowV1TableRecordDeleteNode } from './operation_delete';
import type { ServiceNowV1TableRecordGetNode } from './operation_get';
import type { ServiceNowV1TableRecordGetAllNode } from './operation_get_all';
import type { ServiceNowV1TableRecordUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type ServiceNowV1TableRecordNode =
  | ServiceNowV1TableRecordCreateNode
  | ServiceNowV1TableRecordDeleteNode
  | ServiceNowV1TableRecordGetNode
  | ServiceNowV1TableRecordGetAllNode
  | ServiceNowV1TableRecordUpdateNode
  ;