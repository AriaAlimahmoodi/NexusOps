/**
 * Microsoft Agent 365 Trigger Node - Version 1.1
 * Trigger for Microsoft Agent 365
 */


export interface LcMicrosoftAgent365TriggerV11Params {
  systemPrompt?: string | Expression<string>;
/**
 * Whether to allow the agent to use Microsoft MCP tools like Calendar, Email, and OneDrive to assist in completing tasks. Requires appropriate permissions in your Microsoft account.
 * @default false
 */
    useMcpTools?: boolean | Expression<boolean>;
/**
 * Tools to Include
 * @displayOptions.show { useMcpTools: [true] }
 * @default all
 */
    include?: 'all' | 'selected' | Expression<string>;
/**
 * Tools to Include
 * @displayOptions.show { useMcpTools: [true], include: ["selected"] }
 * @default []
 */
    includeTools?: Array<'mcp_Admin365_GraphTools' | 'mcp_AdminTools' | 'mcp_CalendarTools' | 'mcp_DASearch' | 'mcp_ExcelServer' | 'mcp_KnowledgeTools' | 'mcp_M365Copilot' | 'mcp_MailTools' | 'mcp_OneDriveRemoteServer' | 'mcp_ODSPRemoteServer' | 'mcp_PlannerServer' | 'mcp_SharePointRemoteServer' | 'mcp_SharePointListsTools' | 'mcp_TaskPersonalizationServer' | 'mcp_TeamsServer' | 'mcp_TeamsCanaryServer' | 'mcp_TeamsServerV1' | 'mcp_WebSearchTools' | 'mcp_W365ComputerUse' | 'mcp_WordServer'>;
  hasOutputParser?: boolean;
  options?: {
    /** The maximum number of iterations the agent will run before stopping
     * @default 10
     */
    maxIterations?: number | Expression<number>;
    /** Welcome Message
     * @default Hello! I'm here to help you!
     */
    welcomeMessage?: string | Expression<string>;
  };
}

export interface LcMicrosoftAgent365TriggerV11SubnodeConfig {
  model?: LanguageModelInstance | LanguageModelInstance[];
  memory?: MemoryInstance;
  outputParser?: OutputParserInstance;
  tools?: ToolInstance[];
}

export interface LcMicrosoftAgent365TriggerV11Credentials {
  microsoftAgent365Api: CredentialReference;
}

interface LcMicrosoftAgent365TriggerV11NodeBase {
  type: '@n8n/n8n-nodes-langchain.microsoftAgent365Trigger';
  version: 1.1;
  isTrigger: true;
}

export type LcMicrosoftAgent365TriggerV11ParamsNode = LcMicrosoftAgent365TriggerV11NodeBase & {
  config: NodeConfig<LcMicrosoftAgent365TriggerV11Params> & { credentials?: LcMicrosoftAgent365TriggerV11Credentials } & { subnodes?: LcMicrosoftAgent365TriggerV11SubnodeConfig };
};

export type LcMicrosoftAgent365TriggerV11Node = LcMicrosoftAgent365TriggerV11ParamsNode;