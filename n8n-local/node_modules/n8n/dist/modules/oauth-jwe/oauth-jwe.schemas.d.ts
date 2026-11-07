import { z } from 'zod';
export declare const PublicJweJwkSchema: z.ZodDiscriminatedUnion<"kty", [z.ZodObject<{
    kty: z.ZodLiteral<"RSA">;
    kid: z.ZodString;
    n: z.ZodString;
    e: z.ZodString;
} & {
    use: z.ZodLiteral<"enc">;
    alg: z.ZodEnum<["RSA-OAEP-256"]>;
}, "strict", z.ZodTypeAny, {
    kty: "RSA";
    kid: string;
    n: string;
    e: string;
    use: "enc";
    alg: "RSA-OAEP-256";
}, {
    kty: "RSA";
    kid: string;
    n: string;
    e: string;
    use: "enc";
    alg: "RSA-OAEP-256";
}>, z.ZodObject<{
    kty: z.ZodLiteral<"EC">;
    kid: z.ZodString;
    crv: z.ZodEnum<["P-256", "P-384", "P-521"]>;
    x: z.ZodString;
    y: z.ZodString;
} & {
    use: z.ZodLiteral<"enc">;
    alg: z.ZodEnum<["ECDH-ES", "ECDH-ES+A128KW", "ECDH-ES+A192KW", "ECDH-ES+A256KW"]>;
}, "strict", z.ZodTypeAny, {
    kty: "EC";
    kid: string;
    crv: "P-256" | "P-384" | "P-521";
    x: string;
    y: string;
    use: "enc";
    alg: "ECDH-ES" | "ECDH-ES+A128KW" | "ECDH-ES+A192KW" | "ECDH-ES+A256KW";
}, {
    kty: "EC";
    kid: string;
    crv: "P-256" | "P-384" | "P-521";
    x: string;
    y: string;
    use: "enc";
    alg: "ECDH-ES" | "ECDH-ES+A128KW" | "ECDH-ES+A192KW" | "ECDH-ES+A256KW";
}>]>;
export type PublicJweJwk = z.infer<typeof PublicJweJwkSchema>;
