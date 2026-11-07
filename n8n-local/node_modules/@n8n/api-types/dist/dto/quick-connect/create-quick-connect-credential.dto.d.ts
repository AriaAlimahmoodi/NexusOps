import { z } from 'zod';
declare const GetQuickConnectApiKeyDto_base: import("../../zod-class").ZodClass<{
    quickConnectType: string;
}, {
    quickConnectType: z.ZodString;
}>;
export declare class GetQuickConnectApiKeyDto extends GetQuickConnectApiKeyDto_base {
}
export {};
