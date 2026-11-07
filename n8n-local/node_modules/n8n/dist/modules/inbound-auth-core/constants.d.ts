export declare const SYSTEM_TRUSTED_SOURCE_ID = "n8n-internal";
export declare const SYSTEM_TRUSTED_SOURCE_NAME = "n8n";
export declare const SYSTEM_TRUSTED_SOURCE_CONFIG: {
    version: 1;
    authentication: {
        type: "oauth2";
        discovery: {
            mode: "auto";
        };
        keys: {
            kind: "local-keystore";
        };
        verification: {
            mode: "jwt";
        };
        client: {
            kind: "virtual";
        };
    };
    surfaces: {
        'public-api': {};
        'instance-mcp': {};
        trigger: {};
    };
    identity: {
        subject: "n8n-user-id";
        claimMapping: {
            subject: string;
            clientId: string;
            scopes: string;
        };
        linkByEmail: "off";
        provision: {
            human: "off";
        };
        roleMapping: {
            mode: "off";
            instanceRoleRules: never[];
            projectRoleRules: never[];
        };
    };
};
