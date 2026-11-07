/**
 * Databricks - UnityCatalog Resource
 * Re-exports all operation types for this resource.
 */

import type { DatabricksV1UnityCatalogCreateCatalogNode } from './operation_create_catalog';
import type { DatabricksV1UnityCatalogCreateFunctionNode } from './operation_create_function';
import type { DatabricksV1UnityCatalogCreateTableNode } from './operation_create_table';
import type { DatabricksV1UnityCatalogCreateVolumeNode } from './operation_create_volume';
import type { DatabricksV1UnityCatalogDeleteCatalogNode } from './operation_delete_catalog';
import type { DatabricksV1UnityCatalogDeleteFunctionNode } from './operation_delete_function';
import type { DatabricksV1UnityCatalogDeleteTableNode } from './operation_delete_table';
import type { DatabricksV1UnityCatalogDeleteVolumeNode } from './operation_delete_volume';
import type { DatabricksV1UnityCatalogGetCatalogNode } from './operation_get_catalog';
import type { DatabricksV1UnityCatalogGetFunctionNode } from './operation_get_function';
import type { DatabricksV1UnityCatalogGetTableNode } from './operation_get_table';
import type { DatabricksV1UnityCatalogGetVolumeNode } from './operation_get_volume';
import type { DatabricksV1UnityCatalogListCatalogsNode } from './operation_list_catalogs';
import type { DatabricksV1UnityCatalogListFunctionsNode } from './operation_list_functions';
import type { DatabricksV1UnityCatalogListTablesNode } from './operation_list_tables';
import type { DatabricksV1UnityCatalogListVolumesNode } from './operation_list_volumes';
import type { DatabricksV1UnityCatalogUpdateCatalogNode } from './operation_update_catalog';

export * from './operation_create_catalog';
export * from './operation_create_function';
export * from './operation_create_table';
export * from './operation_create_volume';
export * from './operation_delete_catalog';
export * from './operation_delete_function';
export * from './operation_delete_table';
export * from './operation_delete_volume';
export * from './operation_get_catalog';
export * from './operation_get_function';
export * from './operation_get_table';
export * from './operation_get_volume';
export * from './operation_list_catalogs';
export * from './operation_list_functions';
export * from './operation_list_tables';
export * from './operation_list_volumes';
export * from './operation_update_catalog';

export type DatabricksV1UnityCatalogNode =
  | DatabricksV1UnityCatalogCreateCatalogNode
  | DatabricksV1UnityCatalogCreateFunctionNode
  | DatabricksV1UnityCatalogCreateTableNode
  | DatabricksV1UnityCatalogCreateVolumeNode
  | DatabricksV1UnityCatalogDeleteCatalogNode
  | DatabricksV1UnityCatalogDeleteFunctionNode
  | DatabricksV1UnityCatalogDeleteTableNode
  | DatabricksV1UnityCatalogDeleteVolumeNode
  | DatabricksV1UnityCatalogGetCatalogNode
  | DatabricksV1UnityCatalogGetFunctionNode
  | DatabricksV1UnityCatalogGetTableNode
  | DatabricksV1UnityCatalogGetVolumeNode
  | DatabricksV1UnityCatalogListCatalogsNode
  | DatabricksV1UnityCatalogListFunctionsNode
  | DatabricksV1UnityCatalogListTablesNode
  | DatabricksV1UnityCatalogListVolumesNode
  | DatabricksV1UnityCatalogUpdateCatalogNode
  ;