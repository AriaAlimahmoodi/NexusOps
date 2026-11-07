/**
 * One Simple API Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { OneSimpleApiV1InformationNode } from './resource_information';
import type { OneSimpleApiV1SocialProfileNode } from './resource_social_profile';
import type { OneSimpleApiV1UtilityNode } from './resource_utility';
import type { OneSimpleApiV1WebsiteNode } from './resource_website';

export * from './resource_information';
export * from './resource_social_profile';
export * from './resource_utility';
export * from './resource_website';

export type OneSimpleApiV1Node =
  | OneSimpleApiV1InformationNode
  | OneSimpleApiV1SocialProfileNode
  | OneSimpleApiV1UtilityNode
  | OneSimpleApiV1WebsiteNode
  ;