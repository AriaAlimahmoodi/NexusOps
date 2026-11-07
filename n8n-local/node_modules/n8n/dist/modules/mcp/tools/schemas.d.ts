import type { IConnections, INode, IWorkflowGroup, IWorkflowSettings, WorkflowFEMeta } from 'n8n-workflow';
import z from 'zod';
export declare const nodeCredentialSummarySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
}, {
    id: string;
    name: string;
}>;
export declare const nodeSchema: z.ZodObject<{
    name: z.ZodString;
    type: z.ZodString;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>>;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    name: z.ZodString;
    type: z.ZodString;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>>;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    name: z.ZodString;
    type: z.ZodString;
    credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
    }, {
        id: string;
        name: string;
    }>>>;
}, z.ZodTypeAny, "passthrough">>;
export declare const ensureNodeParameters: (nodes: INode[]) => INode[];
export declare const sanitizeNodeCredentials: (rawNode: INode) => {
    id: string;
    name: string;
    typeVersion: number;
    type: string;
    position: [number, number];
    disabled?: boolean;
    notes?: string;
    notesInFlow?: boolean;
    retryOnFail?: boolean;
    maxTries?: number;
    waitBetweenTries?: number;
    alwaysOutputData?: boolean;
    executeOnce?: boolean;
    onError?: import("n8n-workflow").OnError;
    continueOnFail?: boolean;
    customTelemetryTags?: {
        tag?: import("n8n-workflow").ICustomTelemetryTag[];
    };
    parameters: import("n8n-workflow").INodeParameters;
    webhookId?: string;
    extendsCredential?: string;
    rewireOutputLogTo?: import("n8n-workflow").NodeConnectionType;
    forceCustomOperation?: {
        resource: string;
        operation: string;
    };
} | {
    id: string;
    name: string;
    typeVersion: number;
    type: string;
    position: [number, number];
    disabled?: boolean;
    notes?: string;
    notesInFlow?: boolean;
    retryOnFail?: boolean;
    maxTries?: number;
    waitBetweenTries?: number;
    alwaysOutputData?: boolean;
    executeOnce?: boolean;
    onError?: import("n8n-workflow").OnError;
    continueOnFail?: boolean;
    customTelemetryTags?: {
        tag?: import("n8n-workflow").ICustomTelemetryTag[];
    };
    parameters: import("n8n-workflow").INodeParameters;
    webhookId?: string;
    extendsCredential?: string;
    rewireOutputLogTo?: import("n8n-workflow").NodeConnectionType;
    forceCustomOperation?: {
        resource: string;
        operation: string;
    };
    credentials: {
        [k: string]: {
            id: string;
            name: string;
        };
    };
};
export declare const connectionsSchema: z.ZodType<IConnections, z.ZodTypeDef, IConnections>;
export declare const tagSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    name: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    name: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const toTagSummary: (tags: Array<{
    id: string;
    name: string;
}> | undefined | null) => {
    id: string;
    name: string;
}[];
export declare const workflowSettingsSchema: z.ZodNullable<z.ZodType<IWorkflowSettings, z.ZodTypeDef, IWorkflowSettings>>;
export declare const workflowMetaSchema: z.ZodNullable<z.ZodType<WorkflowFEMeta, z.ZodTypeDef, WorkflowFEMeta>>;
export declare const dataTableColumnTypeSchema: z.ZodEnum<["string", "number", "boolean", "date"]>;
export declare const dataTableColumnSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["string", "number", "boolean", "date"]>;
    index: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    type: "boolean" | "date" | "number" | "string";
    index: number;
}, {
    id: string;
    name: string;
    type: "boolean" | "date" | "number" | "string";
    index: number;
}>;
export declare const dataTableSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    projectId: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    columns: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["string", "number", "boolean", "date"]>;
        index: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }, {
        id: string;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    columns: {
        id: string;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }[];
}, {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    columns: {
        id: string;
        name: string;
        type: "boolean" | "date" | "number" | "string";
        index: number;
    }[];
}>;
export declare const createLimitSchema: (max: number) => z.ZodOptional<z.ZodNumber>;
export declare const dataTableProjectIdSchema: z.ZodString;
export declare const columnNameSchema: z.ZodString;
export declare const folderOutputSchema: {
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    parentFolderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    error: z.ZodOptional<z.ZodString>;
};
export declare const dataTableRowSchema: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodNull]>>;
export declare const successMessageOutputSchema: {
    success: z.ZodBoolean;
    message: z.ZodString;
};
export declare const nodeGroupSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    nodeNames: z.ZodArray<z.ZodString, "many">;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    nodeNames: string[];
    description?: string | undefined;
}, {
    id: string;
    name: string;
    nodeNames: string[];
    description?: string | undefined;
}>;
export type NodeGroupSummary = z.infer<typeof nodeGroupSchema>;
export declare const toNodeGroupSummary: (nodeGroups: IWorkflowGroup[], nodes: Array<Pick<INode, 'id' | 'name'>>) => NodeGroupSummary[];
export declare const workflowDetailsOutputSchema: z.ZodObject<{
    workflow: z.ZodObject<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        active: z.ZodBoolean;
        isArchived: z.ZodBoolean;
        versionId: z.ZodString;
        activeVersionId: z.ZodNullable<z.ZodString>;
        triggerCount: z.ZodNumber;
        nodeCount: z.ZodNumber;
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodNullable<z.ZodString>;
        settings: z.ZodNullable<z.ZodType<IWorkflowSettings, z.ZodTypeDef, IWorkflowSettings>>;
        connections: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        nodes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        nodeGroups: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            nodeNames: z.ZodArray<z.ZodString, "many">;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }, {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }>, "many">>;
        activeVersion: z.ZodOptional<z.ZodNullable<z.ZodDiscriminatedUnion<"sameAsDraft", [z.ZodObject<{
            sameAsDraft: z.ZodLiteral<true>;
        }, "strip", z.ZodTypeAny, {
            sameAsDraft: true;
        }, {
            sameAsDraft: true;
        }>, z.ZodObject<{
            sameAsDraft: z.ZodLiteral<false>;
            nodes: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            connections: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            nodeGroups: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                nodeNames: z.ZodArray<z.ZodString, "many">;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }, {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            sameAsDraft: false;
            nodes: z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        }, {
            sameAsDraft: false;
            nodes: z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        }>]>>>;
        tags: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        meta: z.ZodOptional<z.ZodNullable<z.ZodType<WorkflowFEMeta, z.ZodTypeDef, WorkflowFEMeta>>>;
        parentFolderId: z.ZodNullable<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        scopes: z.ZodArray<z.ZodString, "many">;
        canExecute: z.ZodBoolean;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        active: z.ZodBoolean;
        isArchived: z.ZodBoolean;
        versionId: z.ZodString;
        activeVersionId: z.ZodNullable<z.ZodString>;
        triggerCount: z.ZodNumber;
        nodeCount: z.ZodNumber;
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodNullable<z.ZodString>;
        settings: z.ZodNullable<z.ZodType<IWorkflowSettings, z.ZodTypeDef, IWorkflowSettings>>;
        connections: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        nodes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        nodeGroups: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            nodeNames: z.ZodArray<z.ZodString, "many">;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }, {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }>, "many">>;
        activeVersion: z.ZodOptional<z.ZodNullable<z.ZodDiscriminatedUnion<"sameAsDraft", [z.ZodObject<{
            sameAsDraft: z.ZodLiteral<true>;
        }, "strip", z.ZodTypeAny, {
            sameAsDraft: true;
        }, {
            sameAsDraft: true;
        }>, z.ZodObject<{
            sameAsDraft: z.ZodLiteral<false>;
            nodes: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            connections: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            nodeGroups: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                nodeNames: z.ZodArray<z.ZodString, "many">;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }, {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            sameAsDraft: false;
            nodes: z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        }, {
            sameAsDraft: false;
            nodes: z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        }>]>>>;
        tags: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        meta: z.ZodOptional<z.ZodNullable<z.ZodType<WorkflowFEMeta, z.ZodTypeDef, WorkflowFEMeta>>>;
        parentFolderId: z.ZodNullable<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        scopes: z.ZodArray<z.ZodString, "many">;
        canExecute: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        name: z.ZodNullable<z.ZodString>;
        active: z.ZodBoolean;
        isArchived: z.ZodBoolean;
        versionId: z.ZodString;
        activeVersionId: z.ZodNullable<z.ZodString>;
        triggerCount: z.ZodNumber;
        nodeCount: z.ZodNumber;
        createdAt: z.ZodNullable<z.ZodString>;
        updatedAt: z.ZodNullable<z.ZodString>;
        settings: z.ZodNullable<z.ZodType<IWorkflowSettings, z.ZodTypeDef, IWorkflowSettings>>;
        connections: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
        nodes: z.ZodOptional<z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">>, "many">>;
        nodeGroups: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            nodeNames: z.ZodArray<z.ZodString, "many">;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }, {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }>, "many">>;
        activeVersion: z.ZodOptional<z.ZodNullable<z.ZodDiscriminatedUnion<"sameAsDraft", [z.ZodObject<{
            sameAsDraft: z.ZodLiteral<true>;
        }, "strip", z.ZodTypeAny, {
            sameAsDraft: true;
        }, {
            sameAsDraft: true;
        }>, z.ZodObject<{
            sameAsDraft: z.ZodLiteral<false>;
            nodes: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            connections: z.ZodRecord<z.ZodString, z.ZodUnknown>;
            nodeGroups: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                nodeNames: z.ZodArray<z.ZodString, "many">;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }, {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            sameAsDraft: false;
            nodes: z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        }, {
            sameAsDraft: false;
            nodes: z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        }>]>>>;
        tags: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
        meta: z.ZodOptional<z.ZodNullable<z.ZodType<WorkflowFEMeta, z.ZodTypeDef, WorkflowFEMeta>>>;
        parentFolderId: z.ZodNullable<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        scopes: z.ZodArray<z.ZodString, "many">;
        canExecute: z.ZodBoolean;
    }, z.ZodTypeAny, "passthrough">>;
    triggerInfo: z.ZodString;
    activeVersionTriggerInfo: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    workflow: {
        id: string;
        name: string | null;
        active: boolean;
        isArchived: boolean;
        versionId: string;
        activeVersionId: string | null;
        triggerCount: number;
        nodeCount: number;
        createdAt: string | null;
        updatedAt: string | null;
        settings: IWorkflowSettings | null;
        connections?: Record<string, unknown> | undefined;
        nodes?: z.objectOutputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        nodeGroups?: {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }[] | undefined;
        activeVersion?: {
            sameAsDraft: true;
        } | {
            sameAsDraft: false;
            nodes: z.objectOutputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        } | null | undefined;
        tags: z.objectOutputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">[];
        meta?: WorkflowFEMeta | null | undefined;
        parentFolderId: string | null;
        description?: string | undefined;
        scopes: string[];
        canExecute: boolean;
    } & {
        [k: string]: unknown;
    };
    triggerInfo: string;
    activeVersionTriggerInfo?: string | undefined;
}, {
    workflow: {
        id: string;
        name: string | null;
        active: boolean;
        isArchived: boolean;
        versionId: string;
        activeVersionId: string | null;
        triggerCount: number;
        nodeCount: number;
        createdAt: string | null;
        updatedAt: string | null;
        settings: IWorkflowSettings | null;
        connections?: Record<string, unknown> | undefined;
        nodes?: z.objectInputType<{
            name: z.ZodString;
            type: z.ZodString;
            credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                id: string;
                name: string;
            }, {
                id: string;
                name: string;
            }>>>;
        }, z.ZodTypeAny, "passthrough">[] | undefined;
        nodeGroups?: {
            id: string;
            name: string;
            nodeNames: string[];
            description?: string | undefined;
        }[] | undefined;
        activeVersion?: {
            sameAsDraft: true;
        } | {
            sameAsDraft: false;
            nodes: z.objectInputType<{
                name: z.ZodString;
                type: z.ZodString;
                credentials: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    id: string;
                    name: string;
                }, {
                    id: string;
                    name: string;
                }>>>;
            }, z.ZodTypeAny, "passthrough">[];
            connections: Record<string, unknown>;
            nodeGroups: {
                id: string;
                name: string;
                nodeNames: string[];
                description?: string | undefined;
            }[];
        } | null | undefined;
        tags: z.objectInputType<{
            id: z.ZodString;
            name: z.ZodString;
        }, z.ZodTypeAny, "passthrough">[];
        meta?: WorkflowFEMeta | null | undefined;
        parentFolderId: string | null;
        description?: string | undefined;
        scopes: string[];
        canExecute: boolean;
    } & {
        [k: string]: unknown;
    };
    triggerInfo: string;
    activeVersionTriggerInfo?: string | undefined;
}>;
