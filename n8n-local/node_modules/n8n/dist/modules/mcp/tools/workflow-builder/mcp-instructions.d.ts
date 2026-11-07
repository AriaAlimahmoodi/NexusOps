export type McpInstructionsOptions = {
    isBuilderEnabled: boolean;
    isN8nConnectAvailable?: boolean;
    isAgentsEnabled?: boolean;
    isInstanceContextEnabled?: boolean;
    isUserPreferencesEnabled?: boolean;
    credentialDescriptionsEnabled?: boolean;
};
export declare function getMcpInstructions(options: McpInstructionsOptions): string;
