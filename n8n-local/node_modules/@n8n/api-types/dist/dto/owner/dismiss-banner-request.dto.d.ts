declare const DismissBannerRequestDto_base: import("../../zod-class").ZodClass<{
    banner?: string | undefined;
}, {
    banner: import("zod").ZodOptional<import("zod").ZodUnion<[import("zod").ZodEnum<["V1", "TRIAL_OVER", "TRIAL", "NON_PRODUCTION_LICENSE", "EMAIL_CONFIRMATION", "DATA_TABLE_STORAGE_LIMIT_WARNING", "DATA_TABLE_STORAGE_LIMIT_ERROR", "WORKFLOW_AUTO_DEACTIVATED"]>, import("zod").ZodString]>>;
}>;
export declare class DismissBannerRequestDto extends DismissBannerRequestDto_base {
}
export {};
