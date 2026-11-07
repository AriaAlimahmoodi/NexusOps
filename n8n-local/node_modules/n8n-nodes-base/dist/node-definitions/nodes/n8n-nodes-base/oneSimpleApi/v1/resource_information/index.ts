/**
 * One Simple API - Information Resource
 * Re-exports all operation types for this resource.
 */

import type { OneSimpleApiV1InformationExchangeRateNode } from './operation_exchange_rate';
import type { OneSimpleApiV1InformationImageMetadataNode } from './operation_image_metadata';

export * from './operation_exchange_rate';
export * from './operation_image_metadata';

export type OneSimpleApiV1InformationNode =
  | OneSimpleApiV1InformationExchangeRateNode
  | OneSimpleApiV1InformationImageMetadataNode
  ;