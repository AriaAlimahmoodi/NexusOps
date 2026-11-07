import { z } from 'zod/v4';
export declare const oAuthAuthorizationServerMetadataSchema: z.ZodObject<{
    authorization_endpoint: z.ZodURL;
    token_endpoint: z.ZodURL;
    registration_endpoint: z.ZodURL;
    grant_types_supported: z.ZodOptional<z.ZodArray<z.ZodString>>;
    token_endpoint_auth_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString>>;
    code_challenge_methods_supported: z.ZodOptional<z.ZodArray<z.ZodString>>;
    scopes_supported: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare const dynamicClientRegistrationResponseSchema: z.ZodObject<{
    client_id: z.ZodString;
    client_secret: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
