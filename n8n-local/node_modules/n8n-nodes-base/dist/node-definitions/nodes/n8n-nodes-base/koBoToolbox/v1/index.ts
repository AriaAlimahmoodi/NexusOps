/**
 * KoBoToolbox Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { KoBoToolboxV1FileNode } from './resource_file';
import type { KoBoToolboxV1FormNode } from './resource_form';
import type { KoBoToolboxV1HookNode } from './resource_hook';
import type { KoBoToolboxV1SubmissionNode } from './resource_submission';

export * from './resource_file';
export * from './resource_form';
export * from './resource_hook';
export * from './resource_submission';

export type KoBoToolboxV1Node =
  | KoBoToolboxV1FileNode
  | KoBoToolboxV1FormNode
  | KoBoToolboxV1HookNode
  | KoBoToolboxV1SubmissionNode
  ;