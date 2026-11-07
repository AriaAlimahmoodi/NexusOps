import type { ContentOrFactory, MessageBlock, PromptBuilderOptions, SectionOptions } from './types';
export declare class PromptBuilder {
    private readonly sections;
    private readonly format;
    private readonly separator;
    constructor(options?: PromptBuilderOptions);
    section(name: string, content: ContentOrFactory, options?: SectionOptions): this;
    sectionIf(condition: unknown, name: string, content: ContentOrFactory, options?: SectionOptions): this;
    examples<T>(name: string, examples: T[], formatter?: (example: T) => string, options?: SectionOptions): this;
    examplesIf<T>(condition: unknown, name: string, examples: T[], formatter?: (example: T) => string, options?: SectionOptions): this;
    withExamples<T>(examples: T[], formatter?: (example: T) => string): this;
    merge(other: PromptBuilder): this;
    build(): string;
    buildAsMessageBlocks(): MessageBlock[];
    estimateTokens(): number;
}
export declare function prompt(options?: PromptBuilderOptions): PromptBuilder;
