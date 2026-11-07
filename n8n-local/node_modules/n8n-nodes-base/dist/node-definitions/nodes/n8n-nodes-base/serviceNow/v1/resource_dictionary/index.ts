/**
 * ServiceNow - Dictionary Resource
 * Re-exports all operation types for this resource.
 */

import type { ServiceNowV1DictionaryGetAllNode } from './operation_get_all';

export * from './operation_get_all';

export type ServiceNowV1DictionaryNode = ServiceNowV1DictionaryGetAllNode;