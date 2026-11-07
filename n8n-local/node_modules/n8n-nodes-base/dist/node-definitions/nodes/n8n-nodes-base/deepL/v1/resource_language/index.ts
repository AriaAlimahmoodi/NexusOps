/**
 * DeepL - Language Resource
 * Re-exports all operation types for this resource.
 */

import type { DeepLV1LanguageTranslateNode } from './operation_translate';

export * from './operation_translate';

export type DeepLV1LanguageNode = DeepLV1LanguageTranslateNode;