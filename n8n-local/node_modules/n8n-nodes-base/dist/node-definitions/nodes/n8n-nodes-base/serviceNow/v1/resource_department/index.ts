/**
 * ServiceNow - Department Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1DepartmentGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ServiceNowV1DepartmentNode = ServiceNowV1DepartmentGetAllNode;