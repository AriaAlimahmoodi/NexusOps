/**
 * One Simple API - Website Resource
 * Re-exports all operation types for this resource.
 */

import type { OneSimpleApiV1WebsitePdfNode } from './operation_pdf';
import type { OneSimpleApiV1WebsiteScreenshotNode } from './operation_screenshot';
import type { OneSimpleApiV1WebsiteSeoNode } from './operation_seo';

export * from './operation_pdf';
export * from './operation_screenshot';
export * from './operation_seo';

export type OneSimpleApiV1WebsiteNode =
  | OneSimpleApiV1WebsitePdfNode
  | OneSimpleApiV1WebsiteScreenshotNode
  | OneSimpleApiV1WebsiteSeoNode
  ;