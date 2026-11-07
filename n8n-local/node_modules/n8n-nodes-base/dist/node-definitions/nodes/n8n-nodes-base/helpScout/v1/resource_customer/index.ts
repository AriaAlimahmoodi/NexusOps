/**
 * Help Scout - Customer Resource
 * Re-exports all operation types for this resource.
 */

import type { HelpScoutV1CustomerCreateNode } from './operation_create';
import type { HelpScoutV1CustomerGetNode } from './operation_get';
import type { HelpScoutV1CustomerGetAllNode } from './operation_get_all';
import type { HelpScoutV1CustomerPropertiesNode } from './operation_properties';
import type { HelpScoutV1CustomerUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_properties';
export * from './operation_update';

export type HelpScoutV1CustomerNode =
  | HelpScoutV1CustomerCreateNode
  | HelpScoutV1CustomerGetNode
  | HelpScoutV1CustomerGetAllNode
  | HelpScoutV1CustomerPropertiesNode
  | HelpScoutV1CustomerUpdateNode
  ;