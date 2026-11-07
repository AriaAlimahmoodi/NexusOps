/**
 * Model Selector Node - Version 1
 * Use this node to select one of the connected models to this node based on workflow data
 */


export interface LcModelSelectorV1Params {
/**
 * The number of data inputs you want to merge. The node waits for all connected inputs to be executed.
 * @default 2
 */
    numberInputs?: 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
/**
 * Rules to map workflow data to specific models
 * @default {}
 */
    rules?: {
        /** Rule
     */
    rule?: Array<{
      /** Choose model input from the list
       * @loadOptionsMethod getModels
       * @default 1
       */
      modelIndex?: string | Expression<string>;
      /** Conditions that must be met to select this model
       * @default {}
       */
      conditions?: FilterValue;
    }>;
  };
}

export interface LcModelSelectorV1SubnodeConfig {
  model?: LanguageModelInstance | LanguageModelInstance[];
}

interface LcModelSelectorV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.modelSelector';
  version: 1;
}

export type LcModelSelectorV1ParamsNode = LcModelSelectorV1NodeBase & {
  config: NodeConfig<LcModelSelectorV1Params> & { subnodes?: LcModelSelectorV1SubnodeConfig };
};

export type LcModelSelectorV1Node = LcModelSelectorV1ParamsNode;