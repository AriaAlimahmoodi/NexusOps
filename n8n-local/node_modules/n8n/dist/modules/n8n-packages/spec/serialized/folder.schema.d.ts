import { z } from 'zod';
export declare const serializedFolderSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    parentFolderId: z.ZodNullable<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    parentFolderId: string | null;
}, {
    id: string;
    name: string;
    parentFolderId: string | null;
}>;
export type SerializedFolder = z.infer<typeof serializedFolderSchema>;
