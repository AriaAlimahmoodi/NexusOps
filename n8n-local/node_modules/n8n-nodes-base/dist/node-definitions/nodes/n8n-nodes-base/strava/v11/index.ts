/**
 * Strava Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { StravaV11ActivityNode } from './resource_activity';

export * from './resource_activity';

export type StravaV11Node = StravaV11ActivityNode;