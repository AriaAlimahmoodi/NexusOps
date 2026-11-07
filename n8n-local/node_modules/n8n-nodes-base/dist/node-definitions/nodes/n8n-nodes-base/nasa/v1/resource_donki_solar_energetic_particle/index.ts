/**
 * NASA - DonkiSolarEnergeticParticle Resource
 * Re-exports all operation types for this resource.
 */

import type { NasaV1DonkiSolarEnergeticParticleGetNode } from './operation_get';

export * from './operation_get';

export type NasaV1DonkiSolarEnergeticParticleNode = NasaV1DonkiSolarEnergeticParticleGetNode;