/**
 * Google Gemini Node - Version 1.2
 * Re-exports all discriminator combinations.
 */

import type { LcGoogleGeminiV12AudioNode } from './resource_audio';
import type { LcGoogleGeminiV12DocumentNode } from './resource_document';
import type { LcGoogleGeminiV12FileSearchNode } from './resource_file_search';
import type { LcGoogleGeminiV12ImageNode } from './resource_image';
import type { LcGoogleGeminiV12FileNode } from './resource_file';
import type { LcGoogleGeminiV12TextNode } from './resource_text';
import type { LcGoogleGeminiV12VideoNode } from './resource_video';

export * from './resource_audio';
export * from './resource_document';
export * from './resource_file_search';
export * from './resource_image';
export * from './resource_file';
export * from './resource_text';
export * from './resource_video';

export type LcGoogleGeminiV12Node =
  | LcGoogleGeminiV12AudioNode
  | LcGoogleGeminiV12DocumentNode
  | LcGoogleGeminiV12FileSearchNode
  | LcGoogleGeminiV12ImageNode
  | LcGoogleGeminiV12FileNode
  | LcGoogleGeminiV12TextNode
  | LcGoogleGeminiV12VideoNode
  ;