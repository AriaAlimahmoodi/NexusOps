import { z } from 'zod';
declare const GenerateCredentialNameRequestQuery_base: import("../../zod-class").ZodClass<{
    name?: string | undefined;
}, {
    name: z.ZodOptional<z.ZodString>;
}>;
export declare class GenerateCredentialNameRequestQuery extends GenerateCredentialNameRequestQuery_base {
}
export {};
