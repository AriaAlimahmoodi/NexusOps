/**
 * Storyblok - Story Resource
 * Re-exports all operation types for this resource.
 */

import type { StoryblokV1StoryGetNode } from './operation_get';
import type { StoryblokV1StoryGetAllNode } from './operation_get_all';

export * from './operation_get';
export * from './operation_get_all';

export type StoryblokV1StoryNode =
  | StoryblokV1StoryGetNode
  | StoryblokV1StoryGetAllNode
  ;