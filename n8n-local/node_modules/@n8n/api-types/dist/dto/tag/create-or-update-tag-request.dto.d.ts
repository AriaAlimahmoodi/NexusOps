import { z } from 'zod';
declare const CreateOrUpdateTagRequestDto_base: import("../../zod-class").ZodClass<{
    name: string;
}, {
    name: z.ZodString;
}>;
export declare class CreateOrUpdateTagRequestDto extends CreateOrUpdateTagRequestDto_base {
}
export {};
