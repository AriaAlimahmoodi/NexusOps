/**
 * ServiceNow - UserGroup Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1UserGroupGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ServiceNowV1UserGroupNode = ServiceNowV1UserGroupGetAllNode;