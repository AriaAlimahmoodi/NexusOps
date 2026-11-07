declare const ResolvePasswordTokenQueryDto_base: import("../../zod-class").ZodClass<{
    token: string;
}, {
    token: import("zod").ZodString;
}>;
export declare class ResolvePasswordTokenQueryDto extends ResolvePasswordTokenQueryDto_base {
}
export {};
