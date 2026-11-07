/**
 * Uplead Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { UpleadV1CompanyNode } from './resource_company';
import type { UpleadV1PersonNode } from './resource_person';

export * from './resource_company';
export * from './resource_person';

export type UpleadV1Node =
  | UpleadV1CompanyNode
  | UpleadV1PersonNode
  ;