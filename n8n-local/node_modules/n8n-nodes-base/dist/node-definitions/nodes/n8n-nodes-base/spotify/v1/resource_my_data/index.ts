/**
 * Spotify - MyData Resource
 * Re-exports all operation types for this resource.
 */

import type { SpotifyV1MyDataGetFollowingArtistsNode } from './operation_get_following_artists';

export * from './operation_get_following_artists';

export type SpotifyV1MyDataNode = SpotifyV1MyDataGetFollowingArtistsNode;