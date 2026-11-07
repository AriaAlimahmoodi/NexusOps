import z from 'zod';
export declare const webhookPayloadSchema: z.ZodObject<{
    method: z.ZodDefault<z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>>>;
    query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
    query?: Record<string, string> | undefined;
    body?: Record<string, unknown> | undefined;
    headers?: Record<string, string> | undefined;
}, {
    method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
    query?: Record<string, string> | undefined;
    body?: Record<string, unknown> | undefined;
    headers?: Record<string, string> | undefined;
}>;
export declare const chatWorkflowInputSchema: z.ZodObject<{
    chatInput: z.ZodString;
}, "strict", z.ZodTypeAny, {
    chatInput: string;
}, {
    chatInput: string;
}>;
export declare const formWorkflowInputSchema: z.ZodObject<{
    formData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    formData: Record<string, unknown>;
}, {
    formData: Record<string, unknown>;
}>;
export declare const webhookWorkflowInputSchema: z.ZodObject<{
    webhookData: z.ZodObject<{
        method: z.ZodDefault<z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>>>;
        query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    }, {
        method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    webhookData: {
        method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    };
}, {
    webhookData: {
        method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    };
}>;
export declare const workflowInputsSchema: z.ZodUnion<[z.ZodObject<{
    chatInput: z.ZodString;
}, "strict", z.ZodTypeAny, {
    chatInput: string;
}, {
    chatInput: string;
}>, z.ZodObject<{
    formData: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, "strict", z.ZodTypeAny, {
    formData: Record<string, unknown>;
}, {
    formData: Record<string, unknown>;
}>, z.ZodObject<{
    webhookData: z.ZodObject<{
        method: z.ZodDefault<z.ZodOptional<z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]>>>;
        query: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        body: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    }, {
        method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    webhookData: {
        method: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    };
}, {
    webhookData: {
        method?: "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT" | undefined;
        query?: Record<string, string> | undefined;
        body?: Record<string, unknown> | undefined;
        headers?: Record<string, string> | undefined;
    };
}>]>;
export type WorkflowInputs = z.infer<typeof workflowInputsSchema>;
export declare const triggerRequiresInputs: (nodeType: string) => boolean;
export declare const getExpectedInputsDescription: (nodeType: string) => string;
export declare const getExecuteWorkflowCallExample: (nodeType: string) => string;
