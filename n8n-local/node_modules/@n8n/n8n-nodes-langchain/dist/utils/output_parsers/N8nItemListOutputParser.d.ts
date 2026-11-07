import { BaseOutputParser } from '@langchain/core/output_parsers';
export declare class N8nItemListOutputParser extends BaseOutputParser<string[]> {
    lc_namespace: string[];
    private numberOfItems;
    private separator;
    constructor(options: {
        numberOfItems?: number;
        separator?: string;
    });
    parse(text: string): Promise<string[]>;
    getFormatInstructions(): string;
    getSchema(): void;
}
