import { z } from 'zod';
export declare const serializedWorkflowMetadataSchema: z.ZodObject<{
    versionId: z.ZodString;
    publishedVersionId: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    versionId: string;
    publishedVersionId: string | null;
}, {
    versionId: string;
    publishedVersionId: string | null;
}>;
export type SerializedWorkflowMetadata = z.infer<typeof serializedWorkflowMetadataSchema>;
