/**
 * MCP Client Tool Node - Version 1.1
 * Connect tools from an MCP Server
 */


export interface LcMcpClientToolV11Params {
/**
 * Endpoint of your MCP server
 */
    endpointUrl: string | Expression<string>;
/**
 * The transport used by your endpoint
 * @default sse
 */
    serverTransport?: 'httpStreamable' | 'sse' | Expression<string>;
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

export interface LcMcpClientToolV11Credentials {
  httpBearerAuth: CredentialReference;
  httpHeaderAuth: CredentialReference;
  mcpOAuth2Api: CredentialReference;
  httpMultipleHeadersAuth: CredentialReference;
}

interface LcMcpClientToolV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.mcpClientTool';
  version: 1.1;
}

export type LcMcpClientToolV11ParamsNode = LcMcpClientToolV11NodeBase & {
  config: NodeConfig<LcMcpClientToolV11Params> & { credentials?: LcMcpClientToolV11Credentials };
};

export type LcMcpClientToolV11Node = LcMcpClientToolV11ParamsNode;