import { z } from 'zod';
export declare const serializedProjectSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    icon: z.ZodOptional<z.ZodObject<{
        type: z.ZodEnum<["emoji", "icon"]>;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "emoji" | "icon";
        value: string;
    }, {
        type: "emoji" | "icon";
        value: string;
    }>>;
    customTelemetryTags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        value: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        key: string;
        value: string;
    }, {
        key: string;
        value: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    description?: string | undefined;
    icon?: {
        type: "emoji" | "icon";
        value: string;
    } | undefined;
    customTelemetryTags?: {
        key: string;
        value: string;
    }[] | undefined;
}, {
    id: string;
    name: string;
    description?: string | undefined;
    icon?: {
        type: "emoji" | "icon";
        value: string;
    } | undefined;
    customTelemetryTags?: {
        key: string;
        value: string;
    }[] | undefined;
}>;
export type SerializedProject = z.infer<typeof serializedProjectSchema>;
