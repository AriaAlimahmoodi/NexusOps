declare const CreateFolderDto_base: import("../../zod-class").ZodClass<{
    name: string;
    parentFolderId?: string | undefined;
}, {
    name: import("zod").ZodPipeline<import("zod").ZodEffects<import("zod").ZodString, string, string>, import("zod").ZodString>;
    parentFolderId: import("zod").ZodOptional<import("zod").ZodString>;
}>;
export declare class CreateFolderDto extends CreateFolderDto_base {
}
export {};
