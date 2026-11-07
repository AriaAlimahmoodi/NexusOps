/**
 * Think Tool Node - Version 1
 * Invite the AI agent to do some thinking
 */


export interface LcToolThinkV1Params {
/**
 * The thinking tool's description
 * @default Use the tool to think about something. It will not obtain new information or change the database, but just append the thought to the log. Use it when complex reasoning or some cache memory is needed.
 */
    description?: string | Expression<string>;
}

interface LcToolThinkV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.toolThink';
  version: 1;
}

export type LcToolThinkV1ParamsNode = LcToolThinkV1NodeBase & {
  config: NodeConfig<LcToolThinkV1Params>;
};

export type LcToolThinkV1Node = LcToolThinkV1ParamsNode;