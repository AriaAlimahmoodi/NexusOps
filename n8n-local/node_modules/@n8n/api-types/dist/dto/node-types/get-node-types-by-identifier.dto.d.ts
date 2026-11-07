import { z } from 'zod';
declare const GetNodeTypesByIdentifierRequestDto_base: import("../../zod-class").ZodClass<{
    identifiers: string[];
}, {
    identifiers: z.ZodArray<z.ZodString, "many">;
}>;
export declare class GetNodeTypesByIdentifierRequestDto extends GetNodeTypesByIdentifierRequestDto_base {
}
export {};
