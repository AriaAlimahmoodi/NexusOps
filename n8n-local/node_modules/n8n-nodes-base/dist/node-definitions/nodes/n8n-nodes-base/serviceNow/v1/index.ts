/**
 * ServiceNow Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { ServiceNowV1AttachmentNode } from './resource_attachment';
import type { ServiceNowV1BusinessServiceNode } from './resource_business_service';
import type { ServiceNowV1ConfigurationItemsNode } from './resource_configuration_items';
import type { ServiceNowV1DepartmentNode } from './resource_department';
import type { ServiceNowV1DictionaryNode } from './resource_dictionary';
import type { ServiceNowV1IncidentNode } from './resource_incident';
import type { ServiceNowV1TableRecordNode } from './resource_table_record';
import type { ServiceNowV1UserNode } from './resource_user';
import type { ServiceNowV1UserGroupNode } from './resource_user_group';
import type { ServiceNowV1UserRoleNode } from './resource_user_role';

export * from './resource_attachment';
export * from './resource_business_service';
export * from './resource_configuration_items';
export * from './resource_department';
export * from './resource_dictionary';
export * from './resource_incident';
export * from './resource_table_record';
export * from './resource_user';
export * from './resource_user_group';
export * from './resource_user_role';

export type ServiceNowV1Node =
  | ServiceNowV1AttachmentNode
  | ServiceNowV1BusinessServiceNode
  | ServiceNowV1ConfigurationItemsNode
  | ServiceNowV1DepartmentNode
  | ServiceNowV1DictionaryNode
  | ServiceNowV1IncidentNode
  | ServiceNowV1TableRecordNode
  | ServiceNowV1UserNode
  | ServiceNowV1UserGroupNode
  | ServiceNowV1UserRoleNode
  ;