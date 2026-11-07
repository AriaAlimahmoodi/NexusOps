/**
 * Google Gemini Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { LcGoogleGeminiV1AudioNode } from './resource_audio';
import type { LcGoogleGeminiV1DocumentNode } from './resource_document';
import type { LcGoogleGeminiV1FileSearchNode } from './resource_file_search';
import type { LcGoogleGeminiV1ImageNode } from './resource_image';
import type { LcGoogleGeminiV1FileNode } from './resource_file';
import type { LcGoogleGeminiV1TextNode } from './resource_text';
import type { LcGoogleGeminiV1VideoNode } from './resource_video';

export * from './resource_audio';
export * from './resource_document';
export * from './resource_file_search';
export * from './resource_image';
export * from './resource_file';
export * from './resource_text';
export * from './resource_video';

export type LcGoogleGeminiV1Node =
  | LcGoogleGeminiV1AudioNode
  | LcGoogleGeminiV1DocumentNode
  | LcGoogleGeminiV1FileSearchNode
  | LcGoogleGeminiV1ImageNode
  | LcGoogleGeminiV1FileNode
  | LcGoogleGeminiV1TextNode
  | LcGoogleGeminiV1VideoNode
  ;