/**
 * Philips Hue Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { PhilipsHueV1LightNode } from './resource_light';

export * from './resource_light';

export type PhilipsHueV1Node = PhilipsHueV1LightNode;