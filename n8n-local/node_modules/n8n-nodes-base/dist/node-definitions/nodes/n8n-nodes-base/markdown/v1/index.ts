/**
 * Markdown Node - Version 1
 * Re-exports all discriminator combinations.
 */

import type { MarkdownV1HtmlToMarkdownNode } from './mode_html_to_markdown';
import type { MarkdownV1MarkdownToHtmlNode } from './mode_markdown_to_html';

export * from './mode_html_to_markdown';
export * from './mode_markdown_to_html';

export type MarkdownV1Node =
  | MarkdownV1HtmlToMarkdownNode
  | MarkdownV1MarkdownToHtmlNode
  ;