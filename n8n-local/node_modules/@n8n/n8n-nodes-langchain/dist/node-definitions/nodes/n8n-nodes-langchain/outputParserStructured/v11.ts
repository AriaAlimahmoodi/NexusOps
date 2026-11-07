/**
 * Structured Output Parser Node - Version 1.1
 * Return data in a defined JSON format
 */


export interface LcOutputParserStructuredV11Params {
/**
 * Example JSON object to use to generate the schema
 * @displayOptions.show { schemaType: ["fromJson"] }
 */
    jsonSchemaExample?: IDataObject | string;
/**
 * Schema to use for the function
 * @hint Use &lt;a target="_blank" href="https://json-schema.org/"&gt;JSON Schema&lt;/a&gt; format (&lt;a target="_blank" href="https://json-schema.org/learn/miscellaneous-examples.html"&gt;examples&lt;/a&gt;). $refs syntax is currently not supported.
 * @displayOptions.show { schemaType: ["manual"] }
 */
    inputSchema?: IDataObject | string | Expression<string>;
/**
 * JSON Schema to structure and validate the output against
 */
    jsonSchema?: IDataObject | string | Expression<string>;
/**
 * Whether to automatically fix the output when it is not in the correct format. Will cause another LLM call.
 * @default false
 */
    autoFix?: boolean | Expression<boolean>;
/**
 * Whether to customize the prompt used for retrying the output parsing. If disabled, a default prompt will be used.
 * @displayOptions.show { autoFix: [true] }
 * @default false
 */
    customizeRetryPrompt?: boolean | Expression<boolean>;
/**
 * Prompt template used for fixing the output. Uses placeholders: "{instructions}" for parsing rules, "{completion}" for the failed attempt, and "{error}" for the validation error message.
 * @hint Should include "{error}", "{instructions}", and "{completion}" placeholders
 * @displayOptions.show { autoFix: [true], customizeRetryPrompt: [true] }
 */
    prompt?: string | Expression<string>;
}

export interface LcOutputParserStructuredV11SubnodeConfig {
  /**
   * @displayOptions.show { autoFix: [true] }
   */
  model: LanguageModelInstance | LanguageModelInstance[];
}

interface LcOutputParserStructuredV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.outputParserStructured';
  version: 1.1;
}

export type LcOutputParserStructuredV11ParamsNode = LcOutputParserStructuredV11NodeBase & {
  config: NodeConfig<LcOutputParserStructuredV11Params> & { subnodes: LcOutputParserStructuredV11SubnodeConfig };
};

export type LcOutputParserStructuredV11Node = LcOutputParserStructuredV11ParamsNode;