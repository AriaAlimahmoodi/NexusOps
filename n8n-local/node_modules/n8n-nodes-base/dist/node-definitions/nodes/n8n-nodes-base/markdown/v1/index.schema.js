/**
 * Markdown Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getHtmlToMarkdownSchema = require('./mode_html_to_markdown.schema');
const getMarkdownToHtmlSchema = require('./mode_markdown_to_html.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.mode === undefined ? { ...parameters, mode: 'htmlToMarkdown' } : parameters;
  return z.union([
    getHtmlToMarkdownSchema({ ...helpers, parameters: effectiveParams }),
    getMarkdownToHtmlSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};