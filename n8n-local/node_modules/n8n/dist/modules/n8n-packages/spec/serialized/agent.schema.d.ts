import { agentSkillSchema } from '@n8n/api-types';
import { z } from 'zod';
export declare const serializedAgentToolSchema: z.ZodObject<{
    code: z.ZodString;
    descriptor: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        systemInstruction: z.ZodNullable<z.ZodString>;
        inputSchema: z.ZodNullable<z.ZodType<import("json-schema").JSONSchema7, z.ZodTypeDef, import("json-schema").JSONSchema7>>;
        outputSchema: z.ZodNullable<z.ZodType<import("json-schema").JSONSchema7, z.ZodTypeDef, import("json-schema").JSONSchema7>>;
        hasSuspend: z.ZodBoolean;
        hasResume: z.ZodBoolean;
        hasToMessage: z.ZodBoolean;
        requireApproval: z.ZodBoolean;
        outputTrust: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"untrusted">>>;
        providerOptions: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    }, "strict", z.ZodTypeAny, {
        name: string;
        description: string;
        systemInstruction: string | null;
        inputSchema: import("json-schema").JSONSchema7 | null;
        outputSchema: import("json-schema").JSONSchema7 | null;
        hasSuspend: boolean;
        hasResume: boolean;
        hasToMessage: boolean;
        requireApproval: boolean;
        outputTrust?: "untrusted" | null | undefined;
        providerOptions: Record<string, unknown> | null;
    }, {
        name: string;
        description: string;
        systemInstruction: string | null;
        inputSchema: import("json-schema").JSONSchema7 | null;
        outputSchema: import("json-schema").JSONSchema7 | null;
        hasSuspend: boolean;
        hasResume: boolean;
        hasToMessage: boolean;
        requireApproval: boolean;
        outputTrust?: "untrusted" | null | undefined;
        providerOptions: Record<string, unknown> | null;
    }>;
}, "strict", z.ZodTypeAny, {
    code: string;
    descriptor: {
        name: string;
        description: string;
        systemInstruction: string | null;
        inputSchema: import("json-schema").JSONSchema7 | null;
        outputSchema: import("json-schema").JSONSchema7 | null;
        hasSuspend: boolean;
        hasResume: boolean;
        hasToMessage: boolean;
        requireApproval: boolean;
        outputTrust?: "untrusted" | null | undefined;
        providerOptions: Record<string, unknown> | null;
    };
}, {
    code: string;
    descriptor: {
        name: string;
        description: string;
        systemInstruction: string | null;
        inputSchema: import("json-schema").JSONSchema7 | null;
        outputSchema: import("json-schema").JSONSchema7 | null;
        hasSuspend: boolean;
        hasResume: boolean;
        hasToMessage: boolean;
        requireApproval: boolean;
        outputTrust?: "untrusted" | null | undefined;
        providerOptions: Record<string, unknown> | null;
    };
}>;
export declare const serializedAgentTaskSchema: z.ZodObject<{
    name: z.ZodString;
    objective: z.ZodString;
    cronExpression: z.ZodString;
} & {
    timezone: z.ZodDefault<z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    objective: string;
    cronExpression: string;
    timezone: string | null;
}, {
    name: string;
    objective: string;
    cronExpression: string;
    timezone?: string | null | undefined;
}>;
export declare const serializedAgentSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    config: z.ZodNullable<z.ZodEffects<z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        model: z.ZodUnion<[z.ZodLiteral<"">, z.ZodString]>;
        credential: z.ZodOptional<z.ZodString>;
        modelDeploymentName: z.ZodOptional<z.ZodString>;
        instructions: z.ZodString;
        personalisation: z.ZodOptional<z.ZodObject<{
            icon: z.ZodString;
            gradient: z.ZodDefault<z.ZodObject<{
                from: z.ZodString;
                to: z.ZodString;
                angle: z.ZodDefault<z.ZodNumber>;
                fromStop: z.ZodDefault<z.ZodNumber>;
                toStop: z.ZodDefault<z.ZodNumber>;
            }, "strict", z.ZodTypeAny, {
                from: string;
                to: string;
                angle: number;
                fromStop: number;
                toStop: number;
            }, {
                from: string;
                to: string;
                angle?: number | undefined;
                fromStop?: number | undefined;
                toStop?: number | undefined;
            }>>;
        }, "strict", z.ZodTypeAny, {
            icon: string;
            gradient: {
                from: string;
                to: string;
                angle: number;
                fromStop: number;
                toStop: number;
            };
        }, {
            icon: string;
            gradient?: {
                from: string;
                to: string;
                angle?: number | undefined;
                fromStop?: number | undefined;
                toStop?: number | undefined;
            } | undefined;
        }>>;
        memory: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodBoolean;
            storage: z.ZodEnum<["n8n"]>;
            observationalMemory: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodOptional<z.ZodBoolean>;
                observerModel: z.ZodOptional<z.ZodObject<{
                    model: z.ZodString;
                    credential: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    model: string;
                    credential: string;
                }, {
                    model: string;
                    credential: string;
                }>>;
                reflectorModel: z.ZodOptional<z.ZodObject<{
                    model: z.ZodString;
                    credential: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    model: string;
                    credential: string;
                }, {
                    model: string;
                    credential: string;
                }>>;
                observerThresholdTokens: z.ZodOptional<z.ZodNumber>;
                reflectorThresholdTokens: z.ZodOptional<z.ZodNumber>;
                renderTokenBudget: z.ZodOptional<z.ZodNumber>;
                observationLogTailLimit: z.ZodOptional<z.ZodNumber>;
                lockTtlMs: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            }, {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            }>>;
            episodicMemory: z.ZodOptional<z.ZodDiscriminatedUnion<"enabled", [z.ZodObject<{
                enabled: z.ZodLiteral<false>;
            }, "strip", z.ZodTypeAny, {
                enabled: false;
            }, {
                enabled: false;
            }>, z.ZodObject<{
                enabled: z.ZodLiteral<true>;
                credential: z.ZodUnion<[z.ZodLiteral<"managed">, z.ZodString]>;
                reflectorModel: z.ZodOptional<z.ZodObject<{
                    model: z.ZodString;
                    credential: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    model: string;
                    credential: string;
                }, {
                    model: string;
                    credential: string;
                }>>;
                topK: z.ZodOptional<z.ZodNumber>;
                maxEntriesPerRun: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            }, {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            }>]>>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        }, {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        }>>;
        subAgents: z.ZodOptional<z.ZodObject<{
            maxChildren: z.ZodOptional<z.ZodNumber>;
            agents: z.ZodOptional<z.ZodArray<z.ZodObject<{
                agentId: z.ZodString;
                useWhen: z.ZodOptional<z.ZodString>;
                enabled: z.ZodOptional<z.ZodBoolean>;
            }, "strict", z.ZodTypeAny, {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }, {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }>, "many">>;
            modelsByDifficulty: z.ZodOptional<z.ZodObject<{
                low: z.ZodOptional<z.ZodObject<{
                    model: z.ZodString;
                    credential: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    model: string;
                    credential: string;
                }, {
                    model: string;
                    credential: string;
                }>>;
                medium: z.ZodOptional<z.ZodObject<{
                    model: z.ZodString;
                    credential: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    model: string;
                    credential: string;
                }, {
                    model: string;
                    credential: string;
                }>>;
                high: z.ZodOptional<z.ZodObject<{
                    model: z.ZodString;
                    credential: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    model: string;
                    credential: string;
                }, {
                    model: string;
                    credential: string;
                }>>;
            }, "strict", z.ZodTypeAny, {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            }, {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            }>>;
        }, "strict", z.ZodTypeAny, {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        }, {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        }>>;
        tools: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"custom">;
            enabled: z.ZodOptional<z.ZodBoolean>;
            id: z.ZodString;
            requireApproval: z.ZodOptional<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        }, {
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"workflow">;
            enabled: z.ZodOptional<z.ZodBoolean>;
            workflowId: z.ZodOptional<z.ZodString>;
            workflow: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            description: z.ZodOptional<z.ZodString>;
            requireApproval: z.ZodOptional<z.ZodBoolean>;
            allOutputs: z.ZodOptional<z.ZodBoolean>;
            inputs: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"ai">;
                description: z.ZodOptional<z.ZodString>;
            }, "strict", z.ZodTypeAny, {
                mode: "ai";
                description?: string | undefined;
            }, {
                mode: "ai";
                description?: string | undefined;
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"fixed">;
                value: z.ZodType<import("n8n-workflow").JsonValue, z.ZodTypeDef, import("n8n-workflow").JsonValue>;
            }, "strict", z.ZodTypeAny, {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            }, {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"expression">;
                value: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                mode: "expression";
                value: string;
            }, {
                mode: "expression";
                value: string;
            }>]>>>;
        }, "strict", z.ZodTypeAny, {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        }, {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"node">;
            enabled: z.ZodOptional<z.ZodBoolean>;
            name: z.ZodString;
            description: z.ZodOptional<z.ZodString>;
            inputSchema: z.ZodOptional<z.ZodNever>;
            node: z.ZodObject<{
                nodeType: z.ZodString;
                nodeTypeVersion: z.ZodNumber;
                nodeParameters: z.ZodDefault<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>, z.ZodObject<{
                    id: z.ZodNull;
                    name: z.ZodString;
                    __aiGatewayManaged: z.ZodLiteral<true>;
                }, "strip", z.ZodTypeAny, {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }, {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }>]>>>;
            }, "strip", z.ZodTypeAny, {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters: Record<string, unknown>;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            }, {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters?: Record<string, unknown> | undefined;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            }>;
            requireApproval: z.ZodOptional<z.ZodBoolean>;
        }, "strict", z.ZodTypeAny, {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters: Record<string, unknown>;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        }, {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters?: Record<string, unknown> | undefined;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        }>]>, "many">, ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters: Record<string, unknown>;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[], ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters?: Record<string, unknown> | undefined;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[]>>;
        skills: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodObject<{
            type: z.ZodLiteral<"skill">;
            versionId: z.ZodOptional<z.ZodString>;
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }, {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }>, "many">, {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[], {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[]>>;
        tasks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            type: z.ZodLiteral<"task">;
            id: z.ZodString;
            enabled: z.ZodBoolean;
        }, "strip", z.ZodTypeAny, {
            type: "task";
            id: string;
            enabled: boolean;
        }, {
            type: "task";
            id: string;
            enabled: boolean;
        }>, "many">>;
        providerTools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
        integrations: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodDiscriminatedUnion<"type", [z.ZodObject<{
            type: z.ZodLiteral<"telegram">;
            credentialId: z.ZodString;
            approval: z.ZodOptional<z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"global">;
            }, "strict", z.ZodTypeAny, {
                mode: "global";
            }, {
                mode: "global";
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"selected">;
                tools: z.ZodArray<z.ZodString, "many">;
            }, "strict", z.ZodTypeAny, {
                mode: "selected";
                tools: string[];
            }, {
                mode: "selected";
                tools: string[];
            }>]>>;
        } & {
            settings: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                accessMode: z.ZodEnum<["private", "public"]>;
                allowedUsers: z.ZodEffects<z.ZodDefault<z.ZodArray<z.ZodString, "many">>, string[], string[] | undefined>;
                sessionIdleTimeoutMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strict", z.ZodTypeAny, {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }, {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }>, {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }, {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }, {
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"slack">;
            credentialId: z.ZodString;
            approval: z.ZodOptional<z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"global">;
            }, "strict", z.ZodTypeAny, {
                mode: "global";
            }, {
                mode: "global";
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"selected">;
                tools: z.ZodArray<z.ZodString, "many">;
            }, "strict", z.ZodTypeAny, {
                mode: "selected";
                tools: string[];
            }, {
                mode: "selected";
                tools: string[];
            }>]>>;
        } & {
            settings: z.ZodOptional<z.ZodObject<{
                messagingExperience: z.ZodEnum<["assistant", "agent"]>;
                sessionIdleTimeoutMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strict", z.ZodTypeAny, {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }, {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }, {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"linear">;
            credentialId: z.ZodString;
            approval: z.ZodOptional<z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"global">;
            }, "strict", z.ZodTypeAny, {
                mode: "global";
            }, {
                mode: "global";
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"selected">;
                tools: z.ZodArray<z.ZodString, "many">;
            }, "strict", z.ZodTypeAny, {
                mode: "selected";
                tools: string[];
            }, {
                mode: "selected";
                tools: string[];
            }>]>>;
        } & {
            settings: z.ZodOptional<z.ZodObject<{
                sessionIdleTimeoutMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strict", z.ZodTypeAny, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }, {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"discord">;
            credentialId: z.ZodString;
            approval: z.ZodOptional<z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"global">;
            }, "strict", z.ZodTypeAny, {
                mode: "global";
            }, {
                mode: "global";
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"selected">;
                tools: z.ZodArray<z.ZodString, "many">;
            }, "strict", z.ZodTypeAny, {
                mode: "selected";
                tools: string[];
            }, {
                mode: "selected";
                tools: string[];
            }>]>>;
        } & {
            settings: z.ZodOptional<z.ZodObject<{
                sessionIdleTimeoutMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            }, "strict", z.ZodTypeAny, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }, {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"whatsapp">;
            credentialId: z.ZodString;
            approval: z.ZodOptional<z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"global">;
            }, "strict", z.ZodTypeAny, {
                mode: "global";
            }, {
                mode: "global";
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"selected">;
                tools: z.ZodArray<z.ZodString, "many">;
            }, "strict", z.ZodTypeAny, {
                mode: "selected";
                tools: string[];
            }, {
                mode: "selected";
                tools: string[];
            }>]>>;
        } & {
            settings: z.ZodOptional<z.ZodObject<{
                sessionIdleTimeoutMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                typingIndicator: z.ZodOptional<z.ZodBoolean>;
                downloadMedia: z.ZodOptional<z.ZodBoolean>;
                mediaRetentionDays: z.ZodOptional<z.ZodNumber>;
            }, "strict", z.ZodTypeAny, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            }, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        }, {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"teams">;
            credentialId: z.ZodString;
            approval: z.ZodOptional<z.ZodDiscriminatedUnion<"mode", [z.ZodObject<{
                mode: z.ZodLiteral<"global">;
            }, "strict", z.ZodTypeAny, {
                mode: "global";
            }, {
                mode: "global";
            }>, z.ZodObject<{
                mode: z.ZodLiteral<"selected">;
                tools: z.ZodArray<z.ZodString, "many">;
            }, "strict", z.ZodTypeAny, {
                mode: "selected";
                tools: string[];
            }, {
                mode: "selected";
                tools: string[];
            }>]>>;
        } & {
            settings: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                sessionIdleTimeoutMinutes: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                displayName: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
                description: z.ZodOptional<z.ZodString>;
                teamChannels: z.ZodOptional<z.ZodBoolean>;
                groupChats: z.ZodOptional<z.ZodBoolean>;
                readAllChannelMessages: z.ZodOptional<z.ZodBoolean>;
                readAllGroupMessages: z.ZodOptional<z.ZodBoolean>;
            }, "strict", z.ZodTypeAny, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            }, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            }>, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            }, {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        }, {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        }>, z.ZodObject<{
            type: z.ZodLiteral<"n8n_chat">;
            credentialId: z.ZodDefault<z.ZodLiteral<"">>;
        }, "strict", z.ZodTypeAny, {
            type: "n8n_chat";
            credentialId: "";
        }, {
            type: "n8n_chat";
            credentialId?: "" | undefined;
        }>]>, "many">, ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId: "";
        })[], ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId?: "" | undefined;
        })[]>>;
        mcpServers: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodObject<{
            name: z.ZodEffects<z.ZodString, string, string>;
            description: z.ZodOptional<z.ZodString>;
            url: z.ZodString;
            transport: z.ZodDefault<z.ZodEnum<["sse", "streamableHttp"]>>;
            authentication: z.ZodDefault<z.ZodUnion<[z.ZodEnum<["none", "bearerAuth", "headerAuth", "multipleHeadersAuth", "mcpOAuth2Api"]>, z.ZodString]>>;
            credential: z.ZodOptional<z.ZodString>;
            metadata: z.ZodOptional<z.ZodObject<{
                nodeTypeName: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                nodeTypeName?: string | undefined;
            }, {
                nodeTypeName?: string | undefined;
            }>>;
            toolPermissions: z.ZodOptional<z.ZodObject<{
                categories: z.ZodObject<{
                    read: z.ZodEnum<["always_allow", "require_approval", "blocked"]>;
                    write: z.ZodEnum<["always_allow", "require_approval", "blocked"]>;
                }, "strict", z.ZodTypeAny, {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                }, {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                }>;
                tools: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodEnum<["always_allow", "require_approval", "blocked"]>>>;
            }, "strict", z.ZodTypeAny, {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            }, {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            }>>;
            connectionTimeoutMs: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            name: string;
            description?: string | undefined;
            url: string;
            transport: "sse" | "streamableHttp";
            authentication: string;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }, {
            name: string;
            description?: string | undefined;
            url: string;
            transport?: "sse" | "streamableHttp" | undefined;
            authentication?: string | undefined;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }>, "many">, {
            name: string;
            description?: string | undefined;
            url: string;
            transport: "sse" | "streamableHttp";
            authentication: string;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[], {
            name: string;
            description?: string | undefined;
            url: string;
            transport?: "sse" | "streamableHttp" | undefined;
            authentication?: string | undefined;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[]>>;
        vectorStores: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodDiscriminatedUnion<"provider", [z.ZodObject<{
            name: z.ZodString;
            credential: z.ZodString;
            useWhen: z.ZodString;
            embedding: z.ZodObject<{
                model: z.ZodString;
                credential: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                model: string;
                credential: string;
            }, {
                model: string;
                credential: string;
            }>;
            provider: z.ZodLiteral<"pinecone">;
            indexName: z.ZodString;
            namespace: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        }, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        }>, z.ZodObject<{
            name: z.ZodString;
            credential: z.ZodString;
            useWhen: z.ZodString;
            embedding: z.ZodObject<{
                model: z.ZodString;
                credential: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                model: string;
                credential: string;
            }, {
                model: string;
                credential: string;
            }>;
            provider: z.ZodLiteral<"qdrant">;
            collectionName: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        }, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        }>, z.ZodObject<{
            name: z.ZodString;
            credential: z.ZodString;
            useWhen: z.ZodString;
            embedding: z.ZodObject<{
                model: z.ZodString;
                credential: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                model: string;
                credential: string;
            }, {
                model: string;
                credential: string;
            }>;
            provider: z.ZodLiteral<"supabase">;
            tableName: z.ZodString;
            queryName: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        }, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        }>, z.ZodObject<{
            name: z.ZodString;
            credential: z.ZodString;
            useWhen: z.ZodString;
            embedding: z.ZodObject<{
                model: z.ZodString;
                credential: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                model: string;
                credential: string;
            }, {
                model: string;
                credential: string;
            }>;
            provider: z.ZodLiteral<"postgres">;
            tableName: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        }, {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        }>]>, "many">, ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[], ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[]>>;
        config: z.ZodOptional<z.ZodObject<{
            reasoning: z.ZodOptional<z.ZodEnum<["low", "medium", "high"]>>;
            promptCaching: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodBoolean;
                anthropic: z.ZodOptional<z.ZodObject<{
                    ttl: z.ZodOptional<z.ZodEnum<["5m", "1h"]>>;
                }, "strip", z.ZodTypeAny, {
                    ttl?: "1h" | "5m" | undefined;
                }, {
                    ttl?: "1h" | "5m" | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            }, {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            }>>;
            webSearch: z.ZodOptional<z.ZodObject<{
                enabled: z.ZodBoolean;
                provider: z.ZodOptional<z.ZodEnum<["auto", "native", "brave", "searxng"]>>;
                credential: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            }, {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            }>>;
            toolCallConcurrency: z.ZodOptional<z.ZodNumber>;
            maxIterations: z.ZodOptional<z.ZodNumber>;
            guardrails: z.ZodOptional<z.ZodObject<{
                budget: z.ZodOptional<z.ZodEffects<z.ZodObject<{
                    enabled: z.ZodBoolean;
                    monthlyBudgetUsd: z.ZodOptional<z.ZodNumber>;
                    alertThresholdPercent: z.ZodOptional<z.ZodNumber>;
                    sessionCostCapUsd: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                }, {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                }>, {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                }, {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            }, {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        }, {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        description?: string | undefined;
        model: string;
        credential?: string | undefined;
        modelDeploymentName?: string | undefined;
        instructions: string;
        personalisation?: {
            icon: string;
            gradient: {
                from: string;
                to: string;
                angle: number;
                fromStop: number;
                toStop: number;
            };
        } | undefined;
        memory?: {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        } | undefined;
        subAgents?: {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        } | undefined;
        tools?: ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters: Record<string, unknown>;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[] | undefined;
        skills?: {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[] | undefined;
        tasks?: {
            type: "task";
            id: string;
            enabled: boolean;
        }[] | undefined;
        providerTools?: Record<string, Record<string, unknown>> | undefined;
        integrations?: ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId: "";
        })[] | undefined;
        mcpServers?: {
            name: string;
            description?: string | undefined;
            url: string;
            transport: "sse" | "streamableHttp";
            authentication: string;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[] | undefined;
        vectorStores?: ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[] | undefined;
        config?: {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    }, {
        name: string;
        description?: string | undefined;
        model: string;
        credential?: string | undefined;
        modelDeploymentName?: string | undefined;
        instructions: string;
        personalisation?: {
            icon: string;
            gradient?: {
                from: string;
                to: string;
                angle?: number | undefined;
                fromStop?: number | undefined;
                toStop?: number | undefined;
            } | undefined;
        } | undefined;
        memory?: {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        } | undefined;
        subAgents?: {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        } | undefined;
        tools?: ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters?: Record<string, unknown> | undefined;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[] | undefined;
        skills?: {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[] | undefined;
        tasks?: {
            type: "task";
            id: string;
            enabled: boolean;
        }[] | undefined;
        providerTools?: Record<string, Record<string, unknown>> | undefined;
        integrations?: ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId?: "" | undefined;
        })[] | undefined;
        mcpServers?: {
            name: string;
            description?: string | undefined;
            url: string;
            transport?: "sse" | "streamableHttp" | undefined;
            authentication?: string | undefined;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[] | undefined;
        vectorStores?: ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[] | undefined;
        config?: {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    }>, {
        name: string;
        description?: string | undefined;
        model: string;
        credential?: string | undefined;
        modelDeploymentName?: string | undefined;
        instructions: string;
        personalisation?: {
            icon: string;
            gradient: {
                from: string;
                to: string;
                angle: number;
                fromStop: number;
                toStop: number;
            };
        } | undefined;
        memory?: {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        } | undefined;
        subAgents?: {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        } | undefined;
        tools?: ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters: Record<string, unknown>;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[] | undefined;
        skills?: {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[] | undefined;
        tasks?: {
            type: "task";
            id: string;
            enabled: boolean;
        }[] | undefined;
        providerTools?: Record<string, Record<string, unknown>> | undefined;
        integrations?: ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId: "";
        })[] | undefined;
        mcpServers?: {
            name: string;
            description?: string | undefined;
            url: string;
            transport: "sse" | "streamableHttp";
            authentication: string;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[] | undefined;
        vectorStores?: ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[] | undefined;
        config?: {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    }, {
        name: string;
        description?: string | undefined;
        model: string;
        credential?: string | undefined;
        modelDeploymentName?: string | undefined;
        instructions: string;
        personalisation?: {
            icon: string;
            gradient?: {
                from: string;
                to: string;
                angle?: number | undefined;
                fromStop?: number | undefined;
                toStop?: number | undefined;
            } | undefined;
        } | undefined;
        memory?: {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        } | undefined;
        subAgents?: {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        } | undefined;
        tools?: ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters?: Record<string, unknown> | undefined;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[] | undefined;
        skills?: {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[] | undefined;
        tasks?: {
            type: "task";
            id: string;
            enabled: boolean;
        }[] | undefined;
        providerTools?: Record<string, Record<string, unknown>> | undefined;
        integrations?: ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId?: "" | undefined;
        })[] | undefined;
        mcpServers?: {
            name: string;
            description?: string | undefined;
            url: string;
            transport?: "sse" | "streamableHttp" | undefined;
            authentication?: string | undefined;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[] | undefined;
        vectorStores?: ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[] | undefined;
        config?: {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    }>>;
    availableInMCP: z.ZodBoolean;
    skills: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        instructions: z.ZodString;
        allowedTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        references: z.ZodOptional<z.ZodEffects<z.ZodArray<z.ZodObject<{
            path: z.ZodEffects<z.ZodString, string, string>;
            content: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            path: string;
            content: string;
        }, {
            path: string;
            content: string;
        }>, "many">, {
            path: string;
            content: string;
        }[], {
            path: string;
            content: string;
        }[]>>;
        scripts: z.ZodOptional<z.ZodNever>;
        templates: z.ZodOptional<z.ZodNever>;
        assets: z.ZodOptional<z.ZodNever>;
        examples: z.ZodOptional<z.ZodNever>;
        other: z.ZodOptional<z.ZodNever>;
    }, "strict", z.ZodTypeAny, {
        name: string;
        description: string;
        instructions: string;
        allowedTools?: string[] | undefined;
        references?: {
            path: string;
            content: string;
        }[] | undefined;
        scripts?: undefined;
        templates?: undefined;
        assets?: undefined;
        examples?: undefined;
        other?: undefined;
    }, {
        name: string;
        description: string;
        instructions: string;
        allowedTools?: string[] | undefined;
        references?: {
            path: string;
            content: string;
        }[] | undefined;
        scripts?: undefined;
        templates?: undefined;
        assets?: undefined;
        examples?: undefined;
        other?: undefined;
    }>>;
    tools: z.ZodRecord<z.ZodString, z.ZodObject<{
        code: z.ZodString;
        descriptor: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            systemInstruction: z.ZodNullable<z.ZodString>;
            inputSchema: z.ZodNullable<z.ZodType<import("json-schema").JSONSchema7, z.ZodTypeDef, import("json-schema").JSONSchema7>>;
            outputSchema: z.ZodNullable<z.ZodType<import("json-schema").JSONSchema7, z.ZodTypeDef, import("json-schema").JSONSchema7>>;
            hasSuspend: z.ZodBoolean;
            hasResume: z.ZodBoolean;
            hasToMessage: z.ZodBoolean;
            requireApproval: z.ZodBoolean;
            outputTrust: z.ZodOptional<z.ZodNullable<z.ZodLiteral<"untrusted">>>;
            providerOptions: z.ZodNullable<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        }, "strict", z.ZodTypeAny, {
            name: string;
            description: string;
            systemInstruction: string | null;
            inputSchema: import("json-schema").JSONSchema7 | null;
            outputSchema: import("json-schema").JSONSchema7 | null;
            hasSuspend: boolean;
            hasResume: boolean;
            hasToMessage: boolean;
            requireApproval: boolean;
            outputTrust?: "untrusted" | null | undefined;
            providerOptions: Record<string, unknown> | null;
        }, {
            name: string;
            description: string;
            systemInstruction: string | null;
            inputSchema: import("json-schema").JSONSchema7 | null;
            outputSchema: import("json-schema").JSONSchema7 | null;
            hasSuspend: boolean;
            hasResume: boolean;
            hasToMessage: boolean;
            requireApproval: boolean;
            outputTrust?: "untrusted" | null | undefined;
            providerOptions: Record<string, unknown> | null;
        }>;
    }, "strict", z.ZodTypeAny, {
        code: string;
        descriptor: {
            name: string;
            description: string;
            systemInstruction: string | null;
            inputSchema: import("json-schema").JSONSchema7 | null;
            outputSchema: import("json-schema").JSONSchema7 | null;
            hasSuspend: boolean;
            hasResume: boolean;
            hasToMessage: boolean;
            requireApproval: boolean;
            outputTrust?: "untrusted" | null | undefined;
            providerOptions: Record<string, unknown> | null;
        };
    }, {
        code: string;
        descriptor: {
            name: string;
            description: string;
            systemInstruction: string | null;
            inputSchema: import("json-schema").JSONSchema7 | null;
            outputSchema: import("json-schema").JSONSchema7 | null;
            hasSuspend: boolean;
            hasResume: boolean;
            hasToMessage: boolean;
            requireApproval: boolean;
            outputTrust?: "untrusted" | null | undefined;
            providerOptions: Record<string, unknown> | null;
        };
    }>>;
    tasks: z.ZodRecord<z.ZodString, z.ZodObject<{
        name: z.ZodString;
        objective: z.ZodString;
        cronExpression: z.ZodString;
    } & {
        timezone: z.ZodDefault<z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>>;
    }, "strict", z.ZodTypeAny, {
        name: string;
        objective: string;
        cronExpression: string;
        timezone: string | null;
    }, {
        name: string;
        objective: string;
        cronExpression: string;
        timezone?: string | null | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    name: string;
    config: {
        name: string;
        description?: string | undefined;
        model: string;
        credential?: string | undefined;
        modelDeploymentName?: string | undefined;
        instructions: string;
        personalisation?: {
            icon: string;
            gradient: {
                from: string;
                to: string;
                angle: number;
                fromStop: number;
                toStop: number;
            };
        } | undefined;
        memory?: {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        } | undefined;
        subAgents?: {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        } | undefined;
        tools?: ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters: Record<string, unknown>;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[] | undefined;
        skills?: {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[] | undefined;
        tasks?: {
            type: "task";
            id: string;
            enabled: boolean;
        }[] | undefined;
        providerTools?: Record<string, Record<string, unknown>> | undefined;
        integrations?: ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers: string[];
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId: "";
        })[] | undefined;
        mcpServers?: {
            name: string;
            description?: string | undefined;
            url: string;
            transport: "sse" | "streamableHttp";
            authentication: string;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[] | undefined;
        vectorStores?: ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[] | undefined;
        config?: {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    } | null;
    availableInMCP: boolean;
    skills: Record<string, {
        name: string;
        description: string;
        instructions: string;
        allowedTools?: string[] | undefined;
        references?: {
            path: string;
            content: string;
        }[] | undefined;
        scripts?: undefined;
        templates?: undefined;
        assets?: undefined;
        examples?: undefined;
        other?: undefined;
    }>;
    tools: Record<string, {
        code: string;
        descriptor: {
            name: string;
            description: string;
            systemInstruction: string | null;
            inputSchema: import("json-schema").JSONSchema7 | null;
            outputSchema: import("json-schema").JSONSchema7 | null;
            hasSuspend: boolean;
            hasResume: boolean;
            hasToMessage: boolean;
            requireApproval: boolean;
            outputTrust?: "untrusted" | null | undefined;
            providerOptions: Record<string, unknown> | null;
        };
    }>;
    tasks: Record<string, {
        name: string;
        objective: string;
        cronExpression: string;
        timezone: string | null;
    }>;
}, {
    id: string;
    name: string;
    config: {
        name: string;
        description?: string | undefined;
        model: string;
        credential?: string | undefined;
        modelDeploymentName?: string | undefined;
        instructions: string;
        personalisation?: {
            icon: string;
            gradient?: {
                from: string;
                to: string;
                angle?: number | undefined;
                fromStop?: number | undefined;
                toStop?: number | undefined;
            } | undefined;
        } | undefined;
        memory?: {
            enabled: boolean;
            storage: "n8n";
            observationalMemory?: {
                enabled?: boolean | undefined;
                observerModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                observerThresholdTokens?: number | undefined;
                reflectorThresholdTokens?: number | undefined;
                renderTokenBudget?: number | undefined;
                observationLogTailLimit?: number | undefined;
                lockTtlMs?: number | undefined;
            } | undefined;
            episodicMemory?: {
                enabled: false;
            } | {
                enabled: true;
                credential: string;
                reflectorModel?: {
                    model: string;
                    credential: string;
                } | undefined;
                topK?: number | undefined;
                maxEntriesPerRun?: number | undefined;
            } | undefined;
        } | undefined;
        subAgents?: {
            maxChildren?: number | undefined;
            agents?: {
                agentId: string;
                useWhen?: string | undefined;
                enabled?: boolean | undefined;
            }[] | undefined;
            modelsByDifficulty?: {
                low?: {
                    model: string;
                    credential: string;
                } | undefined;
                medium?: {
                    model: string;
                    credential: string;
                } | undefined;
                high?: {
                    model: string;
                    credential: string;
                } | undefined;
            } | undefined;
        } | undefined;
        tools?: ({
            type: "custom";
            enabled?: boolean | undefined;
            id: string;
            requireApproval?: boolean | undefined;
        } | {
            type: "workflow";
            enabled?: boolean | undefined;
            workflowId?: string | undefined;
            workflow: string;
            name?: string | undefined;
            description?: string | undefined;
            requireApproval?: boolean | undefined;
            allOutputs?: boolean | undefined;
            inputs?: Record<string, {
                mode: "ai";
                description?: string | undefined;
            } | {
                mode: "fixed";
                value: import("n8n-workflow").JsonValue;
            } | {
                mode: "expression";
                value: string;
            }> | undefined;
        } | {
            type: "node";
            enabled?: boolean | undefined;
            name: string;
            description?: string | undefined;
            inputSchema?: undefined;
            node: {
                nodeType: string;
                nodeTypeVersion: number;
                nodeParameters?: Record<string, unknown> | undefined;
                credentials?: Record<string, {
                    id: string;
                    name: string;
                } | {
                    id: null;
                    name: string;
                    __aiGatewayManaged: true;
                }> | undefined;
            };
            requireApproval?: boolean | undefined;
        })[] | undefined;
        skills?: {
            type: "skill";
            versionId?: string | undefined;
            id: string;
        }[] | undefined;
        tasks?: {
            type: "task";
            id: string;
            enabled: boolean;
        }[] | undefined;
        providerTools?: Record<string, Record<string, unknown>> | undefined;
        integrations?: ({
            type: "telegram";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                accessMode: "private" | "public";
                allowedUsers?: string[] | undefined;
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "slack";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                messagingExperience: "agent" | "assistant";
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "linear";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "discord";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
            } | undefined;
        } | {
            type: "whatsapp";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                typingIndicator?: boolean | undefined;
                downloadMedia?: boolean | undefined;
                mediaRetentionDays?: number | undefined;
            } | undefined;
        } | {
            type: "teams";
            credentialId: string;
            approval?: {
                mode: "global";
            } | {
                mode: "selected";
                tools: string[];
            } | undefined;
            settings?: {
                sessionIdleTimeoutMinutes?: number | null | undefined;
                displayName?: string | undefined;
                description?: string | undefined;
                teamChannels?: boolean | undefined;
                groupChats?: boolean | undefined;
                readAllChannelMessages?: boolean | undefined;
                readAllGroupMessages?: boolean | undefined;
            } | undefined;
        } | {
            type: "n8n_chat";
            credentialId?: "" | undefined;
        })[] | undefined;
        mcpServers?: {
            name: string;
            description?: string | undefined;
            url: string;
            transport?: "sse" | "streamableHttp" | undefined;
            authentication?: string | undefined;
            credential?: string | undefined;
            metadata?: {
                nodeTypeName?: string | undefined;
            } | undefined;
            toolPermissions?: {
                categories: {
                    read: "always_allow" | "blocked" | "require_approval";
                    write: "always_allow" | "blocked" | "require_approval";
                };
                tools?: Record<string, "always_allow" | "blocked" | "require_approval"> | undefined;
            } | undefined;
            connectionTimeoutMs?: number | undefined;
        }[] | undefined;
        vectorStores?: ({
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "pinecone";
            indexName: string;
            namespace?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "qdrant";
            collectionName: string;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "supabase";
            tableName: string;
            queryName?: string | undefined;
        } | {
            name: string;
            credential: string;
            useWhen: string;
            embedding: {
                model: string;
                credential: string;
            };
            provider: "postgres";
            tableName: string;
        })[] | undefined;
        config?: {
            reasoning?: "high" | "low" | "medium" | undefined;
            promptCaching?: {
                enabled: boolean;
                anthropic?: {
                    ttl?: "1h" | "5m" | undefined;
                } | undefined;
            } | undefined;
            webSearch?: {
                enabled: boolean;
                provider?: "auto" | "brave" | "native" | "searxng" | undefined;
                credential?: string | undefined;
            } | undefined;
            toolCallConcurrency?: number | undefined;
            maxIterations?: number | undefined;
            guardrails?: {
                budget?: {
                    enabled: boolean;
                    monthlyBudgetUsd?: number | undefined;
                    alertThresholdPercent?: number | undefined;
                    sessionCostCapUsd?: number | undefined;
                } | undefined;
            } | undefined;
        } | undefined;
    } | null;
    availableInMCP: boolean;
    skills: Record<string, {
        name: string;
        description: string;
        instructions: string;
        allowedTools?: string[] | undefined;
        references?: {
            path: string;
            content: string;
        }[] | undefined;
        scripts?: undefined;
        templates?: undefined;
        assets?: undefined;
        examples?: undefined;
        other?: undefined;
    }>;
    tools: Record<string, {
        code: string;
        descriptor: {
            name: string;
            description: string;
            systemInstruction: string | null;
            inputSchema: import("json-schema").JSONSchema7 | null;
            outputSchema: import("json-schema").JSONSchema7 | null;
            hasSuspend: boolean;
            hasResume: boolean;
            hasToMessage: boolean;
            requireApproval: boolean;
            outputTrust?: "untrusted" | null | undefined;
            providerOptions: Record<string, unknown> | null;
        };
    }>;
    tasks: Record<string, {
        name: string;
        objective: string;
        cronExpression: string;
        timezone?: string | null | undefined;
    }>;
}>;
export declare const serializedAgentMetadataSchema: z.ZodObject<{
    versionId: z.ZodNullable<z.ZodString>;
    publishedVersionId: z.ZodNullable<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    versionId: string | null;
    publishedVersionId: string | null;
}, {
    versionId: string | null;
    publishedVersionId: string | null;
}>;
export type SerializedAgent = z.infer<typeof serializedAgentSchema>;
export type SerializedAgentMetadata = z.infer<typeof serializedAgentMetadataSchema>;
export type SerializedAgentSkill = z.infer<typeof agentSkillSchema>;
export type SerializedAgentTool = z.infer<typeof serializedAgentToolSchema>;
export type SerializedAgentTask = z.infer<typeof serializedAgentTaskSchema>;
