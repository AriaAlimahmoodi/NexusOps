/**
 * Microsoft Entra ID Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MicrosoftEntraV1GroupNode } from './resource_group';
import type { MicrosoftEntraV1UserNode } from './resource_user';

export * from './resource_group';
export * from './resource_user';

export type MicrosoftEntraV1Node =
  | MicrosoftEntraV1GroupNode
  | MicrosoftEntraV1UserNode
  ;