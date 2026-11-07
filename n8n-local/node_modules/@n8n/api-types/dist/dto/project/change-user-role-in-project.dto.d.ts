declare const ChangeUserRoleInProject_base: import("../../zod-class").ZodClass<{
    role: string;
}, {
    role: import("zod").ZodUnion<[import("zod").ZodEnum<["project:admin", "project:editor", "project:viewer", "project:chatUser"]>, import("zod").ZodEffects<import("zod").ZodString, string, string>]>;
}>;
export declare class ChangeUserRoleInProject extends ChangeUserRoleInProject_base {
}
export {};
