/**
 * MISP - Organisation Resource
 * Re-exports all operation types for this resource.
 */

import type { MispV1OrganisationCreateNode } from './operation_create';
import type { MispV1OrganisationDeleteNode } from './operation_delete';
import type { MispV1OrganisationGetNode } from './operation_get';
import type { MispV1OrganisationGetAllNode } from './operation_get_all';
import type { MispV1OrganisationUpdateNode } from './operation_update';

export * from './operation_create';
export * from './operation_delete';
export * from './operation_get';
export * from './operation_get_all';
export * from './operation_update';

export type MispV1OrganisationNode =
  | MispV1OrganisationCreateNode
  | MispV1OrganisationDeleteNode
  | MispV1OrganisationGetNode
  | MispV1OrganisationGetAllNode
  | MispV1OrganisationUpdateNode
  ;