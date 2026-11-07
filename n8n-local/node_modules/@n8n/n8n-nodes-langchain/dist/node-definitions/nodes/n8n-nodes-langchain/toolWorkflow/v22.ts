/**
 * Call n8n Workflow Tool Node - Version 2.2
 * Uses another n8n workflow as a tool. Allows packaging any n8n node(s) as a tool.
 */


// Helper types for special n8n fields
type ResourceMapperField = { id?: string; displayName?: string; required?: boolean; defaultMatch?: boolean; display?: boolean; type?: string; canBeUsedToMatch?: boolean; [key: string]: unknown };
type ResourceMapperCommon = { matchingColumns?: string[]; cachedResultName?: string; [key: string]: unknown };
type ResourceMapperValue = ResourceMapperCommon & { mappingMode: string; value?: null | Record<string, unknown>; schema?: ResourceMapperField[] };

export interface LcToolWorkflowV22Params {
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

interface LcToolWorkflowV22NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolWorkflow';
  version: 2.2;
}

export type LcToolWorkflowV22ParamsNode = LcToolWorkflowV22NodeBase & {
  config: NodeConfig<LcToolWorkflowV22Params>;
};

export type LcToolWorkflowV22Node = LcToolWorkflowV22ParamsNode;