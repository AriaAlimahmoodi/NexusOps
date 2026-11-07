/**
 * NASA - DonkiMagnetopauseCrossing Resource
 * Re-exports all operation types for this resource.
 */

import type { NasaV1DonkiMagnetopauseCrossingGetNode } from './operation_get';

export * from './operation_get';

export type NasaV1DonkiMagnetopauseCrossingNode = NasaV1DonkiMagnetopauseCrossingGetNode;