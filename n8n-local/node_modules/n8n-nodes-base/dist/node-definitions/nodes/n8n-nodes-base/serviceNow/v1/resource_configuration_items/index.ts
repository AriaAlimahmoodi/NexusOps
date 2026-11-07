/**
 * ServiceNow - ConfigurationItems Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1ConfigurationItemsGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ServiceNowV1ConfigurationItemsNode = ServiceNowV1ConfigurationItemsGetAllNode;