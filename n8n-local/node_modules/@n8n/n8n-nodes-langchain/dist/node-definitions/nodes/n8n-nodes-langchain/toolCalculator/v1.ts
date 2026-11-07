/**
 * Calculator Node - Version 1
 * Make it easier for AI agents to perform arithmetic
 */


export interface LcToolCalculatorV1Params {
}

interface LcToolCalculatorV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolCalculator';
  version: 1;
}

export type LcToolCalculatorV1ParamsNode = LcToolCalculatorV1NodeBase & {
  config: NodeConfig<LcToolCalculatorV1Params>;
};

export type LcToolCalculatorV1Node = LcToolCalculatorV1ParamsNode;