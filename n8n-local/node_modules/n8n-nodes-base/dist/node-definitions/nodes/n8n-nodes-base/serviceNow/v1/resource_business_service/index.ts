/**
 * ServiceNow - BusinessService Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1BusinessServiceGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ServiceNowV1BusinessServiceNode = ServiceNowV1BusinessServiceGetAllNode;