/**
 * Intercom - Company Resource
 * Re-exports all operation types for this resource.
 */

import type { IntercomV1CompanyCreateNode } from './operation_create';
import type { IntercomV1CompanyGetNode } from './operation_get';
import type { IntercomV1CompanyGetAllNode } from './operation_get_all';
import type { IntercomV1CompanyUpdateNode } from './operation_update';
import type { IntercomV1CompanyUsersNode } from './operation_users';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';
export * from './operation_users';

export type IntercomV1CompanyNode =
  | IntercomV1CompanyCreateNode
  | IntercomV1CompanyGetNode
  | IntercomV1CompanyGetAllNode
  | IntercomV1CompanyUpdateNode
  | IntercomV1CompanyUsersNode
  ;