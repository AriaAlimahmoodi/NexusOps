/**
 * MCP Client Node - Version 1.1
 * Standalone MCP Client
 */


// Helper types for special n8n fields
type ResourceMapperField = { id?: string; displayName?: string; required?: boolean; defaultMatch?: boolean; display?: boolean; type?: string; canBeUsedToMatch?: boolean; [key: string]: unknown };
type ResourceMapperCommon = { matchingColumns?: string[]; cachedResultName?: string; [key: string]: unknown };
type ResourceMapperValue = ResourceMapperCommon & { mappingMode: string; value?: null | Record<string, unknown>; schema?: ResourceMapperField[] };

export interface LcMcpClientV11Params {
/**
 * The transport used by your endpoint
 * @default httpStreamable
 */
    serverTransport?: 'httpStreamable' | 'sse' | Expression<string>;
/**
 * The URL of the MCP server to connect to
 */
    endpointUrl: string | Expression<string>;
/**
 * The way to authenticate with your endpoint
 * @default none
 */
    authentication?: 'bearerAuth' | 'headerAuth' | 'mcpOAuth2Api' | 'multipleHeadersAuth' | 'none' | Expression<string>;
/**
 * The tool to use
 * @searchListMethod getTools
 * @default {"mode":"list","value":""}
 */
    tool?: { __rl: true; mode: 'list' | 'id'; value: string; cachedResultName?: string };
  inputMode?: 'manual' | 'json';
/**
 * Parameters
 * @displayOptions.show { inputMode: ["manual"] }
 * @default {"mappingMode":"defineBelow","value":null}
 */
    parameters?: ResourceMapperValue;
/**
 * JSON
 * @displayOptions.show { inputMode: ["json"] }
 */
    jsonInput?: IDataObject | string | Expression<string>;
/**
 * Additional options to add
 * @default {}
 */
    options?: {
    /** Whether to convert images and audio to binary data. If false, images and audio will be returned as base64 encoded strings.
     * @default true
     */
    convertToBinary?: boolean | Expression<boolean>;
    /** Time in ms to wait for tool calls to finish
     * @default 60000
     */
    timeout?: number | Expression<number>;
  };
}

export interface LcMcpClientV11Credentials {
  httpBearerAuth: CredentialReference;
  httpHeaderAuth: CredentialReference;
  mcpOAuth2Api: CredentialReference;
  httpMultipleHeadersAuth: CredentialReference;
}

interface LcMcpClientV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.mcpClient';
  version: 1.1;
}

export type LcMcpClientV11ParamsNode = LcMcpClientV11NodeBase & {
  config: NodeConfig<LcMcpClientV11Params> & { credentials?: LcMcpClientV11Credentials };
};

export type LcMcpClientV11Node = LcMcpClientV11ParamsNode;