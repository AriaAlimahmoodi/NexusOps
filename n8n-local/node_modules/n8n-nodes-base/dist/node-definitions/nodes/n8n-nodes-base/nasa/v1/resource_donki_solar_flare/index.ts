/**
 * NASA - DonkiSolarFlare Resource
 * Re-exports all operation types for this resource.
 */

import type { NasaV1DonkiSolarFlareGetNode } from './operation_get';

export * from './operation_get';

export type NasaV1DonkiSolarFlareNode = NasaV1DonkiSolarFlareGetNode;