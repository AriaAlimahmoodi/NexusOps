/**
 * Gotify Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { GotifyV1MessageNode } from './resource_message';

export * from './resource_message';

export type GotifyV1Node = GotifyV1MessageNode;