import { z } from 'zod';
export type SerializedCredentialDataValue = string | SerializedCredentialDataValue[] | {
    [key: string]: SerializedCredentialDataValue;
};
export declare const serializedCredentialDataSchema: z.ZodRecord<z.ZodString, z.ZodType<SerializedCredentialDataValue, z.ZodTypeDef, SerializedCredentialDataValue>>;
export type SerializedCredentialData = z.infer<typeof serializedCredentialDataSchema>;
export declare const serializedCredentialSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodString;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodType<SerializedCredentialDataValue, z.ZodTypeDef, SerializedCredentialDataValue>>>;
    dataIsComplete: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    type: string;
    data?: Record<string, SerializedCredentialDataValue> | undefined;
    dataIsComplete?: boolean | undefined;
}, {
    id: string;
    name: string;
    type: string;
    data?: Record<string, SerializedCredentialDataValue> | undefined;
    dataIsComplete?: boolean | undefined;
}>;
export type SerializedCredential = z.infer<typeof serializedCredentialSchema>;
