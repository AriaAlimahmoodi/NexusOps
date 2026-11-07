import type { ButtonStyle, CardElement } from 'chat';
type ComponentText = string | {
    text?: string;
    [key: string]: unknown;
};
export interface SuspendComponent {
    type: string;
    text?: ComponentText;
    label?: string;
    value?: string;
    style?: ButtonStyle | string;
    url?: string;
    altText?: string;
    placeholder?: string;
    button?: {
        label?: string;
        text?: ComponentText;
        value: string;
        style?: ButtonStyle | string;
    };
    options?: Array<{
        label: string;
        value: string;
        description?: string;
    }>;
    fields?: Array<{
        label: string;
        value: string;
    }>;
    items?: Array<{
        label: string;
        value: string;
    }>;
    elements?: Array<{
        type: string;
        text?: ComponentText;
        url?: string;
        altText?: string;
    }>;
    id?: string;
    [key: string]: unknown;
}
interface SuspendPayload {
    title?: string;
    message?: string;
    components: SuspendComponent[];
}
export declare const INTERACTIVE_CARD_RESUME_JSON_SCHEMA: {
    readonly type: 'object';
    readonly properties: {
        readonly type: {
            readonly type: 'string';
        };
        readonly id: {
            readonly type: 'string';
        };
        readonly value: {
            readonly type: 'string';
        };
    };
};
export type ShortenCallback = (actionId: string, value: string, label?: string) => Promise<{
    id: string;
    value: string;
}>;
export interface NormalizeComponentsContext {
    runId: string;
    toolCallId: string;
    wrapResumeValue: (rawValue: string) => string;
}
export declare function expandSelectsToButtons(components: SuspendComponent[]): SuspendComponent[];
export declare class ComponentMapper {
    toCard(payload: SuspendPayload, runId: string, toolCallId: string, resumeSchema?: unknown, shortenCallback?: ShortenCallback, platform?: string): Promise<CardElement>;
    private appendComponent;
    private appendSection;
    private appendImage;
    private appendContext;
    private appendSelect;
    private appendRadioSelect;
    private appendFields;
    private toSelectOptions;
    private wrapValueForSchema;
    toCardOrMarkdown(message: unknown): Promise<unknown>;
    private appendMarkdownChild;
    private appendMarkdownContext;
}
export declare function componentTextToString(text: unknown): string | undefined;
export {};
