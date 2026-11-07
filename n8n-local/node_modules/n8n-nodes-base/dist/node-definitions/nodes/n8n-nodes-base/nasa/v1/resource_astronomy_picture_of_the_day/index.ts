/**
 * NASA - AstronomyPictureOfTheDay Resource
 * Re-exports all operation types for this resource.
 */

import type { NasaV1AstronomyPictureOfTheDayGetNode } from './operation_get';

export * from './operation_get';

export type NasaV1AstronomyPictureOfTheDayNode = NasaV1AstronomyPictureOfTheDayGetNode;