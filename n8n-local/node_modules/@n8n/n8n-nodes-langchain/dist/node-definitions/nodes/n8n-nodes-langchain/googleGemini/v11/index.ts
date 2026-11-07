/**
 * Google Gemini Node - Version 1.1
 * Re-exports all discriminator combinations.
 */

import type { LcGoogleGeminiV11AudioNode } from './resource_audio';
import type { LcGoogleGeminiV11DocumentNode } from './resource_document';
import type { LcGoogleGeminiV11FileSearchNode } from './resource_file_search';
import type { LcGoogleGeminiV11ImageNode } from './resource_image';
import type { LcGoogleGeminiV11FileNode } from './resource_file';
import type { LcGoogleGeminiV11TextNode } from './resource_text';
import type { LcGoogleGeminiV11VideoNode } from './resource_video';

export * from './resource_audio';
export * from './resource_document';
export * from './resource_file_search';
export * from './resource_image';
export * from './resource_file';
export * from './resource_text';
export * from './resource_video';

export type LcGoogleGeminiV11Node =
  | LcGoogleGeminiV11AudioNode
  | LcGoogleGeminiV11DocumentNode
  | LcGoogleGeminiV11FileSearchNode
  | LcGoogleGeminiV11ImageNode
  | LcGoogleGeminiV11FileNode
  | LcGoogleGeminiV11TextNode
  | LcGoogleGeminiV11VideoNode
  ;