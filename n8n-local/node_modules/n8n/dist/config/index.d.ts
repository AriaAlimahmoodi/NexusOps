import convict from 'convict';
declare const config: convict.Config<{
    userManagement: {
        isInstanceOwnerSetUp: boolean;
        authenticationMethod: string;
    };
    endpoints: {
        rest: string;
    };
    ai: {
        enabled: boolean;
        allowSendingParameterValues: boolean;
    };
}>;
export default config;
export type Config = typeof config;
