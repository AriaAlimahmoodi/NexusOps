import { z } from 'zod';
export declare const serializedVariableSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["string"]>>;
    value: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    name: string;
    type: "string";
    value?: string | undefined;
}, {
    name: string;
    type?: "string" | undefined;
    value?: string | undefined;
}>;
export type SerializedVariable = z.infer<typeof serializedVariableSchema>;
