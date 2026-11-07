import z from 'zod';
export declare const OAuth2OptionsSchema: z.ZodObject<{
    metadataUri: z.ZodString;
    subjectClaim: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    expectedAudience: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
}, "strip", z.ZodTypeAny, {
    metadataUri: string;
    subjectClaim: string;
    expectedAudience?: string | undefined;
}, {
    metadataUri: string;
    subjectClaim?: string | undefined;
    expectedAudience?: string | undefined;
}>;
export type OAuth2Options = z.infer<typeof OAuth2OptionsSchema>;
export declare function sha256(token: string): string;
export declare const AUDIENCE_NOT_DECLARED_MESSAGE = "Token declares no audience, so it cannot be confirmed as issued for this instance";
export declare const AUDIENCE_MISMATCH_MESSAGE = "Token was not issued for the expected audience";
export declare function assertAudience(claims: Record<string, unknown>, expectedAudience: string): void;
