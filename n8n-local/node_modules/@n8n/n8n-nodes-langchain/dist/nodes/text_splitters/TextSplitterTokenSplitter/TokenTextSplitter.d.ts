import type { TokenTextSplitterParams } from '@langchain/textsplitters';
import { TextSplitter } from '@langchain/textsplitters';
import type * as tiktoken from 'js-tiktoken';
export declare class TokenTextSplitter extends TextSplitter implements TokenTextSplitterParams {
    static lc_name(): string;
    encodingName: tiktoken.TiktokenEncoding;
    allowedSpecial: 'all' | string[];
    disallowedSpecial: 'all' | string[];
    private tokenizer;
    constructor(fields?: Partial<TokenTextSplitterParams>);
    splitText(text: string): Promise<string[]>;
}
