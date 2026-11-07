/**
 * AI Agent Tool Node - Version 2.2
 * Generates an action plan and executes it. Can use external tools.
 */


export interface LcAgentToolV22Params {
/**
 * Explain to the LLM what this tool does, a good, specific description would allow LLMs to produce expected results much more often
 * @default AI Agent that can call other tools
 */
    toolDescription?: string | Expression<string>;
/**
 * Prompt (User Message)
 * @builderHint Use expressions to include dynamic data from previous nodes (e.g., expr('{{ $json.input }}')). Static text prompts ignore incoming data.
 * @placeholderSupported false
 */
    text: string | Expression<string>;
  hasOutputParser?: boolean;
/**
 * Enable Fallback Model
 * @default false
 */
    needsFallback?: boolean;
/**
 * Options
 * @default {}
 */
    options?: {
    /** The message that will be sent to the agent before the conversation starts
     * @builderHint Must include: agent's purpose, exact names of connected tools, and response instructions
     * @default You are a helpful assistant
     */
    systemMessage?: string | Expression<string>;
    /** The maximum number of iterations the agent will run before stopping
     * @default 10
     */
    maxIterations?: number | Expression<number>;
    /** Whether or not the output should include intermediate steps the agent took
     * @default false
     */
    returnIntermediateSteps?: boolean | Expression<boolean>;
    /** Whether or not binary images should be automatically passed through to the agent as image type messages
     * @default true
     */
    passthroughBinaryImages?: boolean | Expression<boolean>;
    /** Whether or not binary PDF documents should be automatically passed through to the agent. Useful for models that natively support PDF input (e.g. Google Gemini).
     * @default false
     */
    passthroughBinaryPdfs?: boolean | Expression<boolean>;
    /** Custom metadata added to tracing events
     * @default {}
     */
    tracingMetadata?: {
        /** Metadata
     */
    values?: Array<{
      /** Key
       */
      key?: string | Expression<string>;
      /** The field value type
       * @default stringValue
       */
      type?: 'arrayValue' | 'booleanValue' | 'numberValue' | 'objectValue' | 'stringValue' | Expression<string>;
      /** Value
       * @displayOptions.show { type: ["stringValue"] }
       */
      stringValue?: string | Expression<string>;
      /** Value
       * @displayOptions.show { type: ["numberValue"] }
       */
      numberValue?: string | Expression<string>;
      /** Value
       * @displayOptions.show { type: ["booleanValue"] }
       * @default true
       */
      booleanValue?: 'true' | 'false' | Expression<string>;
      /** Value
       * @displayOptions.show { type: ["arrayValue"] }
       */
      arrayValue?: string | Expression<string>;
      /** Value
       * @displayOptions.show { type: ["objectValue"] }
       * @default ={}
       */
      objectValue?: IDataObject | string | Expression<string>;
    }>;
  };
    /** Batch processing options for rate limiting
     * @default {}
     */
    batching?: {
    /** How many items to process in parallel. This is useful for rate limiting, but might impact the log output ordering.
     * @default 1
     */
    batchSize?: number | Expression<number>;
    /** Delay in milliseconds between batches. This is useful for rate limiting.
     * @default 0
     */
    delayBetweenBatches?: number | Expression<number>;
  };
  };
}

export interface LcAgentToolV22SubnodeConfig {
  model: LanguageModelInstance | LanguageModelInstance[];
  memory?: MemoryInstance;
  tools?: ToolInstance[];
  /**
   * @displayOptions.show { hasOutputParser: [true] }
   */
  outputParser?: OutputParserInstance;
}

interface LcAgentToolV22NodeBase {
  type: '@n8n/n8n-nodes-langchain.agentTool';
  version: 2.2;
}

export type LcAgentToolV22ParamsNode = LcAgentToolV22NodeBase & {
  config: NodeConfig<LcAgentToolV22Params> & { subnodes: LcAgentToolV22SubnodeConfig };
};

export type LcAgentToolV22Node = LcAgentToolV22ParamsNode;