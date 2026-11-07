export declare const schema: {
    userManagement: {
        isInstanceOwnerSetUp: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
        };
        authenticationMethod: {
            doc: string;
            format: readonly ['email', 'ldap', 'saml'];
            default: string;
        };
    };
    endpoints: {
        rest: {
            format: StringConstructor;
            default: string;
        };
    };
    ai: {
        enabled: {
            format: BooleanConstructor;
            default: boolean;
        };
        allowSendingParameterValues: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
        };
    };
};
