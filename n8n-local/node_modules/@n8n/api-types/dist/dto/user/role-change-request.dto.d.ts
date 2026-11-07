declare const RoleChangeRequestDto_base: import("../../zod-class").ZodClass<{
    newRoleName: string;
}, {
    newRoleName: import("zod").ZodEffects<import("zod").ZodOptional<import("zod").ZodNullable<import("zod").ZodUnion<[import("zod").ZodEnum<["global:admin", "global:member", "global:chatUser"]>, import("zod").ZodEffects<import("zod").ZodString, string, string>]>>>, string, string | null | undefined>;
}>;
export declare class RoleChangeRequestDto extends RoleChangeRequestDto_base {
}
export {};
