/**
 * Microsoft Agent 365 Trigger Node - Version 1.1 - Zod Validation Schemas
 *
 * These schemas validate node configuration at runtime.
 * Use .parse() for strict validation or .safeParse() for error handling.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

module.exports = function getSchema({ parameters, z, expressionSchema, stringOrExpression, numberOrExpression, booleanOrExpression, resourceLocatorValueSchema, resourceMapperValueSchema, filterValueSchema, assignmentCollectionValueSchema, iDataObjectSchema, resolveSchema, resolveOneOfSchemas, languageModelInstanceSchema, memoryInstanceSchema, outputParserInstanceSchema, toolInstanceSchema }) {

  // Static subnode schema
  const subnodesSchema = z.object({
    model: z.union([languageModelInstanceSchema, z.array(languageModelInstanceSchema)]).optional(),
    memory: memoryInstanceSchema.optional(),
    outputParser: outputParserInstanceSchema.optional(),
    tools: z.array(toolInstanceSchema).optional(),
  }).strict();

  // Parameters schema
  const parametersSchema = z.object({
    systemPrompt: stringOrExpression.optional(),
    useMcpTools: booleanOrExpression.optional(),
    include: resolveSchema({ parameters, schema: z.union([z.literal('all'), z.literal('selected'), expressionSchema]), required: false, displayOptions: {"show":{"useMcpTools":[true]}}, defaults: {"useMcpTools":false} }),
    includeTools: resolveSchema({ parameters, schema: z.array(z.union([z.literal('mcp_Admin365_GraphTools'), z.literal('mcp_AdminTools'), z.literal('mcp_CalendarTools'), z.literal('mcp_DASearch'), z.literal('mcp_ExcelServer'), z.literal('mcp_KnowledgeTools'), z.literal('mcp_M365Copilot'), z.literal('mcp_MailTools'), z.literal('mcp_OneDriveRemoteServer'), z.literal('mcp_ODSPRemoteServer'), z.literal('mcp_PlannerServer'), z.literal('mcp_SharePointRemoteServer'), z.literal('mcp_SharePointListsTools'), z.literal('mcp_TaskPersonalizationServer'), z.literal('mcp_TeamsServer'), z.literal('mcp_TeamsCanaryServer'), z.literal('mcp_TeamsServerV1'), z.literal('mcp_WebSearchTools'), z.literal('mcp_W365ComputerUse'), z.literal('mcp_WordServer')])), required: false, displayOptions: {"show":{"useMcpTools":[true],"include":["selected"]}}, defaults: {"useMcpTools":false,"include":"all"} }),
    hasOutputParser: z.boolean().optional(),
    options: z.object({ maxIterations: numberOrExpression.optional(), welcomeMessage: stringOrExpression.optional() }).optional(),
  });

  // Return combined config schema
  return z.object({
    parameters: parametersSchema.nullable().optional(),
    subnodes: subnodesSchema.optional(),
  });
};