export type SectionFormat = 'xml' | 'markdown' | 'plain';
export type ContentOrFactory = string | (() => string | null | undefined);
export interface SectionOptions {
    tag?: string;
    format?: SectionFormat;
    cache?: boolean;
}
export interface PromptBuilderOptions {
    format?: SectionFormat;
    separator?: string;
}
export interface SectionEntry {
    name: string;
    content: ContentOrFactory;
    options: SectionOptions;
}
export interface MessageBlock {
    type: 'text';
    text: string;
    cache_control?: {
        type: 'ephemeral';
    };
}
