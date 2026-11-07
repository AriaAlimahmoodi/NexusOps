/**
 * Call n8n Workflow Tool Node - Version 2.1
 * Uses another n8n workflow as a tool. Allows packaging any n8n node(s) as a tool.
 */


// Helper types for special n8n fields
type ResourceMapperField = { id?: string; displayName?: string; required?: boolean; defaultMatch?: boolean; display?: boolean; type?: string; canBeUsedToMatch?: boolean; [key: string]: unknown };
type ResourceMapperCommon = { matchingColumns?: string[]; cachedResultName?: string; [key: string]: unknown };
type ResourceMapperValue = ResourceMapperCommon & { mappingMode: string; value?: null | Record<string, unknown>; schema?: ResourceMapperField[] };

export interface LcToolWorkflowV21Params {
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
 * Workflow Inputs
 * @displayOptions.show { source: ["database"] }
 * @displayOptions.hide { workflowId: [""] }
 * @default {"mappingMode":"defineBelow","value":null}
 */
    workflowInputs?: ResourceMapperValue;
/**
 * The workflow JSON code to execute
 * @displayOptions.show { source: ["parameter"] }
 */
    workflowJson?: IDataObject | string | Expression<string>;
}

interface LcToolWorkflowV21NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolWorkflow';
  version: 2.1;
}

export type LcToolWorkflowV21ParamsNode = LcToolWorkflowV21NodeBase & {
  config: NodeConfig<LcToolWorkflowV21Params>;
};

export type LcToolWorkflowV21Node = LcToolWorkflowV21ParamsNode;