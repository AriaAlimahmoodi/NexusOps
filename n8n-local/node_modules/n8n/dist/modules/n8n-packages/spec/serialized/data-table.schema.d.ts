import { z } from 'zod';
export declare const serializedDataTableColumnSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    type: z.ZodEnum<["string", "number", "boolean", "date"]>;
    index: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    id?: string | undefined;
    name: string;
    type: "boolean" | "date" | "number" | "string";
    index: number;
}, {
    id?: string | undefined;
    name: string;
    type: "boolean" | "date" | "number" | "string";
    index: number;
}>;
export declare const serializedDataTableSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    columns: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        name: z.ZodString;
        type: z.ZodEnum<["string", "number", "boolean", "date"]>;
        index: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        id?: string | undefined;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }, {
        id?: string | undefined;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    columns: {
        id?: string | undefined;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }[];
}, {
    id: string;
    name: string;
    columns: {
        id?: string | undefined;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }[];
}>, {
    id: string;
    name: string;
    columns: {
        id?: string | undefined;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }[];
}, {
    id: string;
    name: string;
    columns: {
        id?: string | undefined;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }[];
}>;
export type SerializedDataTableColumn = z.infer<typeof serializedDataTableColumnSchema>;
export type SerializedDataTable = z.infer<typeof serializedDataTableSchema>;
