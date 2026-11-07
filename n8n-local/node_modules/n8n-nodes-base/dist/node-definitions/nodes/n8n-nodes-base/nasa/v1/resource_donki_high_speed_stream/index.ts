/**
 * NASA - DonkiHighSpeedStream Resource
 * Re-exports all operation types for this resource.
 */

import type { NasaV1DonkiHighSpeedStreamGetNode } from './operation_get';

export * from './operation_get';

export type NasaV1DonkiHighSpeedStreamNode = NasaV1DonkiHighSpeedStreamGetNode;