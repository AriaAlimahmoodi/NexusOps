/**
 * SIGNL4 Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { Signl4V1AlertNode } from './resource_alert';

export * from './resource_alert';

export type Signl4V1Node = Signl4V1AlertNode;