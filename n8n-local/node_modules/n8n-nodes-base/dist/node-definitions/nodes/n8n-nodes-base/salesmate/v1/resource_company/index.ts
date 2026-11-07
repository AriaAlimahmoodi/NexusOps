/**
 * Salesmate - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { SalesmateV1CompanyCreateNode } from './operation_create';
import type { SalesmateV1CompanyDeleteNode } from './operation_delete';
import type { SalesmateV1CompanyGetNode } from './operation_get';
import type { SalesmateV1CompanyGetAllNode } from './operation_get_all';
import type { SalesmateV1CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type SalesmateV1CompanyNode =
  | SalesmateV1CompanyCreateNode
  | SalesmateV1CompanyDeleteNode
  | SalesmateV1CompanyGetNode
  | SalesmateV1CompanyGetAllNode
  | SalesmateV1CompanyUpdateNode
  ;