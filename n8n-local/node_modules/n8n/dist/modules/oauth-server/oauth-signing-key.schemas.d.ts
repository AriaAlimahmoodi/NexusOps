import { z } from 'zod';
export declare const PublicSigningJwkSchema: z.ZodObject<{
    kty: z.ZodLiteral<"EC">;
    kid: z.ZodString;
    x: z.ZodString;
    y: z.ZodString;
} & {
    use: z.ZodLiteral<"sig">;
    alg: z.ZodLiteral<"ES256">;
    crv: z.ZodLiteral<"P-256">;
}, "strict", z.ZodTypeAny, {
    kty: "EC";
    kid: string;
    x: string;
    y: string;
    use: "sig";
    alg: "ES256";
    crv: "P-256";
}, {
    kty: "EC";
    kid: string;
    x: string;
    y: string;
    use: "sig";
    alg: "ES256";
    crv: "P-256";
}>;
export type PublicSigningJwk = z.infer<typeof PublicSigningJwkSchema>;
