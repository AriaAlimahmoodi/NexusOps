/**
 * Metabase - Databases Resource
 * Re-exports all operation types for this resource.
 */

import type { MetabaseV1DatabasesAddNewDatasourceNode } from './operation_add_new_datasource';
import type { MetabaseV1DatabasesGetAllNode } from './operation_get_all';
import type { MetabaseV1DatabasesGetFieldsNode } from './operation_get_fields';

export * from './operation_add_new_datasource';
export * from './operation_get_all';
export * from './operation_get_fields';

export type MetabaseV1DatabasesNode =
  | MetabaseV1DatabasesAddNewDatasourceNode
  | MetabaseV1DatabasesGetAllNode
  | MetabaseV1DatabasesGetFieldsNode
  ;