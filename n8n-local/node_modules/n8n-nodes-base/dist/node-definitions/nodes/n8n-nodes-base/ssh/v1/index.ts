/**
 * SSH Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { SshV1CommandNode } from './resource_command';
import type { SshV1FileNode } from './resource_file';

export * from './resource_command';
export * from './resource_file';

export type SshV1Node =
  | SshV1CommandNode
  | SshV1FileNode
  ;