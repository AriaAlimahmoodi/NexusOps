/**
 * Auto-fixing Output Parser Node - Version 1
 * Deprecated, use structured output parser
 */


export interface LcOutputParserAutofixingV1Params {
  options?: {
    /** Prompt template used for fixing the output. Uses placeholders: "{instructions}" for parsing rules, "{completion}" for the failed attempt, and "{error}" for the validation error message.
     * @hint Should include "{error}", "{instructions}", and "{completion}" placeholders
     */
    prompt?: string | Expression<string>;
  };
}

export interface LcOutputParserAutofixingV1SubnodeConfig {
  model: LanguageModelInstance | LanguageModelInstance[];
  outputParser: OutputParserInstance;
}

interface LcOutputParserAutofixingV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.outputParserAutofixing';
  version: 1;
}

export type LcOutputParserAutofixingV1ParamsNode = LcOutputParserAutofixingV1NodeBase & {
  config: NodeConfig<LcOutputParserAutofixingV1Params> & { subnodes: LcOutputParserAutofixingV1SubnodeConfig };
};

export type LcOutputParserAutofixingV1Node = LcOutputParserAutofixingV1ParamsNode;