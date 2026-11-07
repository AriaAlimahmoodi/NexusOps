/**
 * NASA - DonkiInterplanetaryShock Resource
 * Re-exports all operation types for this resource.
 */

import type { NasaV1DonkiInterplanetaryShockGetNode } from './operation_get';

export * from './operation_get';

export type NasaV1DonkiInterplanetaryShockNode = NasaV1DonkiInterplanetaryShockGetNode;