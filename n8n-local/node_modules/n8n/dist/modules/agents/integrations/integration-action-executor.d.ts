import { z } from 'zod';
import { ChatIntegrationRegistry } from './agent-chat-integration';
import { ChatIntegrationService } from './chat-integration.service';
import type { IntegrationActionExecutor, IntegrationActionParams, IntegrationActionResult } from './integration-tools';
import { ChannelRateLimitGuard } from './channel-rate-limit.guard';
export declare const respondInputSchema: z.ZodObject<{
    message: z.ZodEffects<z.ZodObject<{
        text: z.ZodOptional<z.ZodString>;
        card: z.ZodOptional<z.ZodObject<{
            awaitResponse: z.ZodOptional<z.ZodBoolean>;
            title: z.ZodOptional<z.ZodString>;
            message: z.ZodOptional<z.ZodString>;
            components: z.ZodArray<z.ZodUnion<[z.ZodObject<{
                type: z.ZodLiteral<"section">;
                text: z.ZodString;
                button: z.ZodOptional<z.ZodObject<{
                    label: z.ZodOptional<z.ZodString>;
                    text: z.ZodOptional<z.ZodString>;
                    value: z.ZodString;
                    style: z.ZodOptional<z.ZodEnum<["primary", "danger", "default"]>>;
                }, "strict", z.ZodTypeAny, {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                }, {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                }>>;
            }, "strict", z.ZodTypeAny, {
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            }, {
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            }>, z.ZodEffects<z.ZodObject<{
                type: z.ZodLiteral<"fields">;
                fields: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    value: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    label: string;
                    value: string;
                }, {
                    label: string;
                    value: string;
                }>, "many">>;
                items: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    value: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    label: string;
                    value: string;
                }, {
                    label: string;
                    value: string;
                }>, "many">>;
            }, "strict", z.ZodTypeAny, {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            }, {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            }>, {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            }, {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"image">;
                url: z.ZodString;
                alt: z.ZodOptional<z.ZodString>;
                altText: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            }, {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"divider">;
            }, "strict", z.ZodTypeAny, {
                type: "divider";
            }, {
                type: "divider";
            }>, z.ZodObject<{
                type: z.ZodLiteral<"button">;
                label: z.ZodOptional<z.ZodString>;
                text: z.ZodOptional<z.ZodString>;
                value: z.ZodString;
                style: z.ZodOptional<z.ZodEnum<["primary", "danger", "default"]>>;
            }, "strict", z.ZodTypeAny, {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            }, {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            }>, z.ZodObject<{
                type: z.ZodLiteral<"select">;
                id: z.ZodOptional<z.ZodString>;
                label: z.ZodOptional<z.ZodString>;
                placeholder: z.ZodOptional<z.ZodString>;
                options: z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    value: z.ZodString;
                    description: z.ZodOptional<z.ZodString>;
                }, "strict", z.ZodTypeAny, {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }, {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }>, "many">;
            }, "strict", z.ZodTypeAny, {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            }, {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            }>, z.ZodObject<{
                type: z.ZodLiteral<"radio_select">;
                id: z.ZodOptional<z.ZodString>;
                label: z.ZodOptional<z.ZodString>;
                placeholder: z.ZodOptional<z.ZodString>;
                options: z.ZodArray<z.ZodObject<{
                    label: z.ZodString;
                    value: z.ZodString;
                    description: z.ZodOptional<z.ZodString>;
                }, "strict", z.ZodTypeAny, {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }, {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }>, "many">;
            }, "strict", z.ZodTypeAny, {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            }, {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            }>]>, "many">;
        }, "strict", z.ZodTypeAny, {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        }, {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        }>>;
    }, "strict", z.ZodTypeAny, {
        text?: string | undefined;
        card?: {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        } | undefined;
    }, {
        text?: string | undefined;
        card?: {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        } | undefined;
    }>, {
        text?: string | undefined;
        card?: {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        } | undefined;
    }, {
        text?: string | undefined;
        card?: {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        } | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    message: {
        text?: string | undefined;
        card?: {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        } | undefined;
    };
}, {
    message: {
        text?: string | undefined;
        card?: {
            awaitResponse?: boolean | undefined;
            title?: string | undefined;
            message?: string | undefined;
            components: ({
                type: "section";
                text: string;
                button?: {
                    label?: string | undefined;
                    text?: string | undefined;
                    value: string;
                    style?: "danger" | "default" | "primary" | undefined;
                } | undefined;
            } | {
                type: "fields";
                fields?: {
                    label: string;
                    value: string;
                }[] | undefined;
                items?: {
                    label: string;
                    value: string;
                }[] | undefined;
            } | {
                type: "image";
                url: string;
                alt?: string | undefined;
                altText?: string | undefined;
            } | {
                type: "divider";
            } | {
                type: "button";
                label?: string | undefined;
                text?: string | undefined;
                value: string;
                style?: "danger" | "default" | "primary" | undefined;
            } | {
                type: "select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            } | {
                type: "radio_select";
                id?: string | undefined;
                label?: string | undefined;
                placeholder?: string | undefined;
                options: {
                    label: string;
                    value: string;
                    description?: string | undefined;
                }[];
            })[];
        } | undefined;
    };
}>;
export declare class ChatIntegrationActionExecutor implements IntegrationActionExecutor {
    private readonly chatIntegrationService;
    private readonly integrationRegistry;
    private readonly channelRateLimitGuard;
    private readonly componentMapper;
    constructor(chatIntegrationService: ChatIntegrationService, integrationRegistry: ChatIntegrationRegistry, channelRateLimitGuard: ChannelRateLimitGuard);
    execute(params: IntegrationActionParams): Promise<IntegrationActionResult>;
    private doNotRespond;
    private addReactionToMessage;
    private respondInCurrentThread;
    private sendDirectMessage;
    private editMessageInCurrentThread;
    private sendChannelMessage;
    private toPostable;
    private getShortenCallback;
    private prepareSentThread;
    private sentThreadId;
}
