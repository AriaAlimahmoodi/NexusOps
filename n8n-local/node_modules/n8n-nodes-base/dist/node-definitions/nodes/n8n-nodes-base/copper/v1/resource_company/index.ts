/**
 * Copper - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { CopperV1CompanyCreateNode } from './operation_create';
import type { CopperV1CompanyDeleteNode } from './operation_delete';
import type { CopperV1CompanyGetNode } from './operation_get';
import type { CopperV1CompanyGetAllNode } from './operation_get_all';
import type { CopperV1CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type CopperV1CompanyNode =
  | CopperV1CompanyCreateNode
  | CopperV1CompanyDeleteNode
  | CopperV1CompanyGetNode
  | CopperV1CompanyGetAllNode
  | CopperV1CompanyUpdateNode
  ;