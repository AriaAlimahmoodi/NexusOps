import { z } from 'zod';
declare const CommunityRegisteredRequestDto_base: import("../../zod-class").ZodClass<{
    email: string;
}, {
    email: z.ZodString;
}>;
export declare class CommunityRegisteredRequestDto extends CommunityRegisteredRequestDto_base {
}
export {};
