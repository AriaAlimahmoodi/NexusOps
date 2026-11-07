declare const DeleteFolderDto_base: import("../../zod-class").ZodClass<{
    transferToFolderId?: string | undefined;
}, {
    transferToFolderId: import("zod").ZodOptional<import("zod").ZodString>;
}>;
export declare class DeleteFolderDto extends DeleteFolderDto_base {
}
export {};
