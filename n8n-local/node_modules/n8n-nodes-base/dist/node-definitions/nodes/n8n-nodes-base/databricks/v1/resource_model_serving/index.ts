/**
 * Databricks - ModelServing Resource
 * Re-exports all operation types for this resource.
 */

import type { DatabricksV1ModelServingQueryEndpointNode } from './operation_query_endpoint';

export * from './operation_query_endpoint';

export type DatabricksV1ModelServingNode = DatabricksV1ModelServingQueryEndpointNode;