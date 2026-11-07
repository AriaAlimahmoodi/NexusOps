import { z } from 'zod';
declare const GetDestinationQueryDto_base: import("../../zod-class").ZodClass<{
    id?: string | undefined;
}, {
    id: z.ZodOptional<z.ZodString>;
}>;
export declare class GetDestinationQueryDto extends GetDestinationQueryDto_base {
}
export {};
