/**
 * Tapfiliate - ProgramAffiliate Resource
 * Re-exports all operation types for this resource.
 */

import type { TapfiliateV1ProgramAffiliateAddNode } from './operation_add';
import type { TapfiliateV1ProgramAffiliateApproveNode } from './operation_approve';
import type { TapfiliateV1ProgramAffiliateDisapproveNode } from './operation_disapprove';
import type { TapfiliateV1ProgramAffiliateGetNode } from './operation_get';
import type { TapfiliateV1ProgramAffiliateGetAllNode } from './operation_get_all';

export * from './operation_add';
export * from './operation_approve';
export * from './operation_disapprove';
export * from './operation_get';
export * from './operation_get_all';

export type TapfiliateV1ProgramAffiliateNode =
  | TapfiliateV1ProgramAffiliateAddNode
  | TapfiliateV1ProgramAffiliateApproveNode
  | TapfiliateV1ProgramAffiliateDisapproveNode
  | TapfiliateV1ProgramAffiliateGetNode
  | TapfiliateV1ProgramAffiliateGetAllNode
  ;