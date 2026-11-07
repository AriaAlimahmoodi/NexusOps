/**
 * MCP Client Tool Node - Version 1
 * Connect tools from an MCP Server
 */


export interface LcMcpClientToolV1Params {
/**
 * SSE Endpoint of your MCP server
 */
    sseEndpoint: string | Expression<string>;
/**
 * The way to authenticate with your endpoint
 * @default none
 */
    authentication?: 'bearerAuth' | 'headerAuth' | 'none' | Expression<string>;
/**
 * How to select the tools you want to be exposed to the AI Agent
 * @default all
 */
    include?: 'all' | 'selected' | 'except' | Expression<string>;
/**
 * Choose from the list, or specify IDs using an &lt;a href="https://docs.n8n.io/code/expressions/"&gt;expression&lt;/a&gt;
 * @loadOptionsMethod getTools
 * @displayOptions.show { include: ["selected"] }
 * @default []
 */
    includeTools?: string[];
/**
 * Choose from the list, or specify IDs using an &lt;a href="https://docs.n8n.io/code/expressions/"&gt;expression&lt;/a&gt;
 * @loadOptionsMethod getTools
 * @displayOptions.show { include: ["except"] }
 * @default []
 */
    excludeTools?: string[];
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Time in ms to wait for tool calls to finish
     * @default 60000
     */
    timeout?: number | Expression<number>;
  };
}

export interface LcMcpClientToolV1Credentials {
  httpBearerAuth: CredentialReference;
  httpHeaderAuth: CredentialReference;
  mcpOAuth2Api: CredentialReference;
  httpMultipleHeadersAuth: CredentialReference;
}

interface LcMcpClientToolV1NodeBase {
  type: '@n8n/n8n-nodes-langchain.mcpClientTool';
  version: 1;
}

export type LcMcpClientToolV1ParamsNode = LcMcpClientToolV1NodeBase & {
  config: NodeConfig<LcMcpClientToolV1Params> & { credentials?: LcMcpClientToolV1Credentials };
};

export type LcMcpClientToolV1Node = LcMcpClientToolV1ParamsNode;