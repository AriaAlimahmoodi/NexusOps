/**
 * Call n8n Workflow Tool Node - Version 1.2
 * Uses another n8n workflow as a tool. Allows packaging any n8n node(s) as a tool.
 */


export interface LcToolWorkflowV12Params {
/**
 * The name of the function to be called, could contain letters, numbers, and underscores only
 */
    name?: string | Expression<string>;
  description?: string | Expression<string>;
/**
 * Where to get the workflow to execute from
 * @default database
 */
    source?: 'database' | 'parameter' | Expression<string>;
/**
 * Workflow
 * @displayOptions.show { source: ["database"] }
 */
    workflowId?: { __rl: true; mode: 'list' | 'id'; value: string | number; cachedResultName?: string; cachedResultUrl?: string } | Expression<string>;
/**
 * The workflow JSON code to execute
 * @displayOptions.show { source: ["parameter"] }
 */
    workflowJson?: IDataObject | string | Expression<string>;
/**
 * Where to find the data that this tool should return. n8n will look in the output of the last-executed node of the workflow for a field with this name, and return its value.
 * @hint The field in the last-executed node of the workflow that contains the response
 * @default response
 */
    responsePropertyName?: string | Expression<string>;
/**
 * These will be output by the 'execute workflow' trigger of the workflow being called
 * @default {}
 */
    fields?: {
        /** Values
     */
    values?: Array<{
      /** Name of the field to set the value of. Supports dot-notation. Example: data.person[0].name.
       */
      name?: string | Expression<string>;
      /** The field value type
       * @default stringValue
       */
      type?: 'stringValue' | 'numberValue' | 'booleanValue' | 'arrayValue' | 'objectValue' | Expression<string>;
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
/**
 * Whether to specify the schema for the function. This would require the LLM to provide the input in the correct format and would validate it against the schema.
 * @default false
 */
    specifyInputSchema?: boolean;
/**
 * How to specify the schema for the function
 * @displayOptions.show { specifyInputSchema: [true] }
 * @default fromJson
 */
    schemaType?: 'fromJson' | 'manual';
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
}

interface LcToolWorkflowV12NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolWorkflow';
  version: 1.2;
}

export type LcToolWorkflowV12ParamsNode = LcToolWorkflowV12NodeBase & {
  config: NodeConfig<LcToolWorkflowV12Params>;
};

export type LcToolWorkflowV12Node = LcToolWorkflowV12ParamsNode;