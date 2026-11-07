/**
 * Wolfram|Alpha Node - Version 1
 * Connects to WolframAlpha's computational intelligence engine.
 */


export interface LcToolWolframAlphaV1Params {
}

export interface LcToolWolframAlphaV1Credentials {
  wolframAlphaApi: CredentialReference;
}

interface LcToolWolframAlphaV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolWolframAlpha';
  version: 1;
}

export type LcToolWolframAlphaV1ParamsNode = LcToolWolframAlphaV1NodeBase & {
  config: NodeConfig<LcToolWolframAlphaV1Params> & { credentials?: LcToolWolframAlphaV1Credentials };
};

export type LcToolWolframAlphaV1Node = LcToolWolframAlphaV1ParamsNode;