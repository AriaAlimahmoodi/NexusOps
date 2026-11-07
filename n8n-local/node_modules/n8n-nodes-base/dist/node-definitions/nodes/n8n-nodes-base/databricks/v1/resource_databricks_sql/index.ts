/**
 * Databricks - DatabricksSql Resource
 * Re-exports all operation types for this resource.
 */

import type { DatabricksV1DatabricksSqlExecuteQueryNode } from './operation_execute_query';

export * from './operation_execute_query';

export type DatabricksV1DatabricksSqlNode = DatabricksV1DatabricksSqlExecuteQueryNode;