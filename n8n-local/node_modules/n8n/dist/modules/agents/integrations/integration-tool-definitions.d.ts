import { type AgentApproval, type RichCardComponent } from '@n8n/api-types';
import { z } from 'zod';
import type { IntegrationAction, IntegrationActionDefinition, IntegrationContextQuery, IntegrationContextQueryDefinition } from './integration-tool-types';
export declare const messageSchema: z.ZodEffects<z.ZodObject<{
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
export type IntegrationCardComponent = RichCardComponent;
export declare const GENERIC_CONTEXT_QUERY_TOOL_DEFINITIONS: ({
    name: "get_current_message_context";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_message_context">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_message_context";
        input: {};
    }, {
        query: "get_current_message_context";
        input: {};
    }>;
    description: string;
} | {
    name: "get_current_subject";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_subject">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_subject";
        input: {};
    }, {
        query: "get_current_subject";
        input: {};
    }>;
    description: string;
} | {
    name: "get_current_user";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_user">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_user";
        input: {};
    }, {
        query: "get_current_user";
        input: {};
    }>;
    description: string;
} | {
    name: "get_current_channel_info";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_channel_info">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_channel_info";
        input: {};
    }, {
        query: "get_current_channel_info";
        input: {};
    }>;
    description: string;
} | {
    name: "get_user";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_user">;
        input: z.ZodObject<{
            userId: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            userId: string;
        }, {
            userId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_user";
        input: {
            userId: string;
        };
    }, {
        query: "get_user";
        input: {
            userId: string;
        };
    }>;
    description: string;
} | {
    name: "get_channel_info";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_channel_info">;
        input: z.ZodObject<{
            channelId: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            channelId: string;
        }, {
            channelId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_channel_info";
        input: {
            channelId: string;
        };
    }, {
        query: "get_channel_info";
        input: {
            channelId: string;
        };
    }>;
    description: string;
} | {
    name: "search_users";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_users">;
        input: z.ZodEffects<z.ZodObject<{
            query: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            includeBots: z.ZodOptional<z.ZodBoolean>;
            includeDeleted: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }>, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_users";
        input: {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        };
    }, {
        query: "search_users";
        input: {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        };
    }>;
    description: string;
} | {
    name: "search_channels";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_channels">;
        input: z.ZodObject<{
            query: z.ZodString;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            includeArchived: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        }, {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_channels";
        input: {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }, {
        query: "search_channels";
        input: {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }>;
    description: string;
})[];
export declare const GENERIC_ACTION_TOOL_DEFINITIONS: ({
    name: "respond";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"respond">;
        input: z.ZodObject<{
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
        }, "strict", z.ZodTypeAny, {
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
    }, "strip", z.ZodTypeAny, {
        action: "respond";
        input: {
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
        };
    }, {
        action: "respond";
        input: {
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
        };
    }>;
    description: string;
    sensitive?: undefined;
} | {
    name: "send_dm";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"send_dm">;
        input: z.ZodObject<{
            userId: z.ZodString;
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
        }, "strict", z.ZodTypeAny, {
            userId: string;
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
            userId: string;
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
    }, "strip", z.ZodTypeAny, {
        action: "send_dm";
        input: {
            userId: string;
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
        };
    }, {
        action: "send_dm";
        input: {
            userId: string;
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
        };
    }>;
    sensitive: true;
    description: string;
} | {
    name: "send_channel_message";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"send_channel_message">;
        input: z.ZodObject<{
            channelId: z.ZodString;
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
        }, "strict", z.ZodTypeAny, {
            channelId: string;
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
            channelId: string;
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
    }, "strip", z.ZodTypeAny, {
        action: "send_channel_message";
        input: {
            channelId: string;
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
        };
    }, {
        action: "send_channel_message";
        input: {
            channelId: string;
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
        };
    }>;
    sensitive: true;
    description: string;
})[];
export declare const DEFAULT_INTEGRATION_CONTEXT_TOOL_DEFINITIONS: ({
    name: "get_current_message_context";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_message_context">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_message_context";
        input: {};
    }, {
        query: "get_current_message_context";
        input: {};
    }>;
    description: string;
} | {
    name: "get_current_subject";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_subject">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_subject";
        input: {};
    }, {
        query: "get_current_subject";
        input: {};
    }>;
    description: string;
} | {
    name: "get_current_user";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_user">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_user";
        input: {};
    }, {
        query: "get_current_user";
        input: {};
    }>;
    description: string;
} | {
    name: "get_current_channel_info";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_current_channel_info">;
        input: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
    }, "strip", z.ZodTypeAny, {
        query: "get_current_channel_info";
        input: {};
    }, {
        query: "get_current_channel_info";
        input: {};
    }>;
    description: string;
} | {
    name: "get_user";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_user">;
        input: z.ZodObject<{
            userId: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            userId: string;
        }, {
            userId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_user";
        input: {
            userId: string;
        };
    }, {
        query: "get_user";
        input: {
            userId: string;
        };
    }>;
    description: string;
} | {
    name: "get_channel_info";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"get_channel_info">;
        input: z.ZodObject<{
            channelId: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            channelId: string;
        }, {
            channelId: string;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "get_channel_info";
        input: {
            channelId: string;
        };
    }, {
        query: "get_channel_info";
        input: {
            channelId: string;
        };
    }>;
    description: string;
} | {
    name: "search_users";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_users">;
        input: z.ZodEffects<z.ZodObject<{
            query: z.ZodOptional<z.ZodString>;
            email: z.ZodOptional<z.ZodString>;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            includeBots: z.ZodOptional<z.ZodBoolean>;
            includeDeleted: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }>, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }, {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_users";
        input: {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        };
    }, {
        query: "search_users";
        input: {
            query?: string | undefined;
            email?: string | undefined;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeBots?: boolean | undefined;
            includeDeleted?: boolean | undefined;
        };
    }>;
    description: string;
} | {
    name: "search_channels";
    inputSchema: z.ZodObject<{
        query: z.ZodLiteral<"search_channels">;
        input: z.ZodObject<{
            query: z.ZodString;
            limit: z.ZodOptional<z.ZodNumber>;
            cursor: z.ZodOptional<z.ZodString>;
            includeArchived: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        }, {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        }>;
    }, "strip", z.ZodTypeAny, {
        query: "search_channels";
        input: {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }, {
        query: "search_channels";
        input: {
            query: string;
            limit?: number | undefined;
            cursor?: string | undefined;
            includeArchived?: boolean | undefined;
        };
    }>;
    description: string;
})[];
export declare const DEFAULT_INTEGRATION_ACTION_TOOL_DEFINITIONS: ({
    name: "respond";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"respond">;
        input: z.ZodObject<{
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
        }, "strict", z.ZodTypeAny, {
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
    }, "strip", z.ZodTypeAny, {
        action: "respond";
        input: {
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
        };
    }, {
        action: "respond";
        input: {
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
        };
    }>;
    description: string;
    sensitive?: undefined;
} | {
    name: "send_dm";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"send_dm">;
        input: z.ZodObject<{
            userId: z.ZodString;
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
        }, "strict", z.ZodTypeAny, {
            userId: string;
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
            userId: string;
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
    }, "strip", z.ZodTypeAny, {
        action: "send_dm";
        input: {
            userId: string;
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
        };
    }, {
        action: "send_dm";
        input: {
            userId: string;
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
        };
    }>;
    sensitive: true;
    description: string;
} | {
    name: "send_channel_message";
    inputSchema: z.ZodObject<{
        action: z.ZodLiteral<"send_channel_message">;
        input: z.ZodObject<{
            channelId: z.ZodString;
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
        }, "strict", z.ZodTypeAny, {
            channelId: string;
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
            channelId: string;
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
    }, "strip", z.ZodTypeAny, {
        action: "send_channel_message";
        input: {
            channelId: string;
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
        };
    }, {
        action: "send_channel_message";
        input: {
            channelId: string;
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
        };
    }>;
    sensitive: true;
    description: string;
})[];
export declare function resolveIntegrationContextQueryDefinitions(queries: IntegrationContextQuery[]): IntegrationContextQueryDefinition[];
export declare function resolveIntegrationActionDefinitions(actions: IntegrationAction[]): IntegrationActionDefinition[];
export declare function actionNeedsApproval(approval: AgentApproval | undefined, action: IntegrationAction): boolean;
