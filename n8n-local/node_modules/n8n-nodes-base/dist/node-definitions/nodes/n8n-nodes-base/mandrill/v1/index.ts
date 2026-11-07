/**
 * Mandrill Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MandrillV1MessageNode } from './resource_message';

export * from './resource_message';

export type MandrillV1Node = MandrillV1MessageNode;