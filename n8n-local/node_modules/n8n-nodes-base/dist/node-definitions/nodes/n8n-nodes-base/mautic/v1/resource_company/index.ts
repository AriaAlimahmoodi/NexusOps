/**
 * Mautic - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { MauticV1CompanyCreateNode } from './operation_create';
import type { MauticV1CompanyDeleteNode } from './operation_delete';
import type { MauticV1CompanyGetNode } from './operation_get';
import type { MauticV1CompanyGetAllNode } from './operation_get_all';
import type { MauticV1CompanyUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MauticV1CompanyNode =
  | MauticV1CompanyCreateNode
  | MauticV1CompanyDeleteNode
  | MauticV1CompanyGetNode
  | MauticV1CompanyGetAllNode
  | MauticV1CompanyUpdateNode
  ;