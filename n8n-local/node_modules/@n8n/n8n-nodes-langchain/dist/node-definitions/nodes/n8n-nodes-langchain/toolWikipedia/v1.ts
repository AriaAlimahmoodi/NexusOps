/**
 * Wikipedia Node - Version 1
 * Search in Wikipedia
 */


export interface LcToolWikipediaV1Params {
}

interface LcToolWikipediaV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolWikipedia';
  version: 1;
}

export type LcToolWikipediaV1ParamsNode = LcToolWikipediaV1NodeBase & {
  config: NodeConfig<LcToolWikipediaV1Params>;
};

export type LcToolWikipediaV1Node = LcToolWikipediaV1ParamsNode;