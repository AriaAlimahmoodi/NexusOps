/**
 * Mautic - CompanyContact Resource
 * Re-exports all operation types for this resource.
 */

import type { MauticV1CompanyContactAddNode } from './operation_add';
import type { MauticV1CompanyContactRemoveNode } from './operation_remove';

export * from './operation_add';
export * from './operation_remove';

export type MauticV1CompanyContactNode =
  | MauticV1CompanyContactAddNode
  | MauticV1CompanyContactRemoveNode
  ;