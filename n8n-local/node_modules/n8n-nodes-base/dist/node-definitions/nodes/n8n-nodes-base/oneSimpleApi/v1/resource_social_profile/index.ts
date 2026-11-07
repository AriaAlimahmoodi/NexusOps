/**
 * One Simple API - SocialProfile Resource
 * Re-exports all operation types for this resource.
 */

import type { OneSimpleApiV1SocialProfileInstagramProfileNode } from './operation_instagram_profile';
import type { OneSimpleApiV1SocialProfileSpotifyArtistProfileNode } from './operation_spotify_artist_profile';

export * from './operation_instagram_profile';
export * from './operation_spotify_artist_profile';

export type OneSimpleApiV1SocialProfileNode =
  | OneSimpleApiV1SocialProfileInstagramProfileNode
  | OneSimpleApiV1SocialProfileSpotifyArtistProfileNode
  ;