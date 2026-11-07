/**
 * Google Workspace Admin Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GSuiteAdminV1DeviceNode } from './resource_device';
import type { GSuiteAdminV1GroupNode } from './resource_group';
import type { GSuiteAdminV1UserNode } from './resource_user';

export * from './resource_device';
export * from './resource_group';
export * from './resource_user';

export type GSuiteAdminV1Node =
  | GSuiteAdminV1DeviceNode
  | GSuiteAdminV1GroupNode
  | GSuiteAdminV1UserNode
  ;