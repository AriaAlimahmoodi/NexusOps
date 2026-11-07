/**
 * ServiceNow - UserRole Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1UserRoleGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ServiceNowV1UserRoleNode = ServiceNowV1UserRoleGetAllNode;