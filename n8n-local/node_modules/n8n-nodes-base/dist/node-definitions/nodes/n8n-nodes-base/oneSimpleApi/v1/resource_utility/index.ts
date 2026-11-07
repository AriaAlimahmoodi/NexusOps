/**
 * One Simple API - Utility Resource
 * Re-exports all operation types for this resource.
 */

import type { OneSimpleApiV1UtilityExpandURLNode } from './operation_expand_u_r_l';
import type { OneSimpleApiV1UtilityQrCodeNode } from './operation_qr_code';
import type { OneSimpleApiV1UtilityValidateEmailNode } from './operation_validate_email';

export * from './operation_expand_u_r_l';
export * from './operation_qr_code';
export * from './operation_validate_email';

export type OneSimpleApiV1UtilityNode =
  | OneSimpleApiV1UtilityExpandURLNode
  | OneSimpleApiV1UtilityQrCodeNode
  | OneSimpleApiV1UtilityValidateEmailNode
  ;