import { z } from 'zod';
export declare const manifestEntrySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    target: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    target: string;
}, {
    id: string;
    name: string;
    target: string;
}>;
export declare const packageManifestSchema: z.ZodEffects<z.ZodObject<{
    packageFormatVersion: z.ZodLiteral<"1">;
    exportedAt: z.ZodString;
    sourceN8nVersion: z.ZodString;
    sourceId: z.ZodString;
    workflows: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    agents: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    folders: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    projects: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    credentials: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    dataTables: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    variables: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    tags: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        target: z.ZodEffects<z.ZodString, string, string>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        name: string;
        target: string;
    }, {
        id: string;
        name: string;
        target: string;
    }>, "many">>;
    requirements: z.ZodOptional<z.ZodObject<{
        credentials: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            usedBy: z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<["workflow", "agent"]>;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "agent" | "workflow";
                id: string;
            }, {
                kind: "agent" | "workflow";
                id: string;
            }>, "many">;
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
            type: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }>, "many">>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined>;
        dataTables: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
            usedBy: z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<["workflow", "agent"]>;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "agent" | "workflow";
                id: string;
            }, {
                kind: "agent" | "workflow";
                id: string;
            }>, "many">;
            id: z.ZodString;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }>, "many">>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined>;
        workflows: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
            usedBy: z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<["workflow", "agent"]>;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "agent" | "workflow";
                id: string;
            }, {
                kind: "agent" | "workflow";
                id: string;
            }>, "many">;
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }>, "many">>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined>;
        agents: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
            usedBy: z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<["workflow", "agent"]>;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "agent" | "workflow";
                id: string;
            }, {
                kind: "agent" | "workflow";
                id: string;
            }>, "many">;
            id: z.ZodString;
            name: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }>, "many">>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined>;
        variables: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
            usedBy: z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<["workflow", "agent"]>;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "agent" | "workflow";
                id: string;
            }, {
                kind: "agent" | "workflow";
                id: string;
            }>, "many">;
            name: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }>, "many">>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined>;
        tags: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            usedBy: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
            } & {
                kind: z.ZodLiteral<"workflow">;
            }, "strip", z.ZodTypeAny, {
                id: string;
                kind: "workflow";
            }, {
                id: string;
                kind: "workflow";
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }, {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }>, "many">>, {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined, {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined>;
        nodeTypes: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodObject<{
            usedBy: z.ZodArray<z.ZodObject<{
                kind: z.ZodEnum<["workflow", "agent"]>;
                id: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                kind: "agent" | "workflow";
                id: string;
            }, {
                kind: "agent" | "workflow";
                id: string;
            }>, "many">;
            type: z.ZodString;
            typeVersion: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }>, "many">>, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined, {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined>;
    }, "strip", z.ZodTypeAny, {
        credentials?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined;
        dataTables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined;
        workflows?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        agents?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        variables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined;
        tags?: {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined;
        nodeTypes?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined;
    }, {
        credentials?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined;
        dataTables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined;
        workflows?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        agents?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        variables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined;
        tags?: {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined;
        nodeTypes?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    packageFormatVersion: "1";
    exportedAt: string;
    sourceN8nVersion: string;
    sourceId: string;
    workflows?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    agents?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    folders?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    projects?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    credentials?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    dataTables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    variables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    tags?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    requirements?: {
        credentials?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined;
        dataTables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined;
        workflows?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        agents?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        variables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined;
        tags?: {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined;
        nodeTypes?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined;
    } | undefined;
}, {
    packageFormatVersion: "1";
    exportedAt: string;
    sourceN8nVersion: string;
    sourceId: string;
    workflows?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    agents?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    folders?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    projects?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    credentials?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    dataTables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    variables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    tags?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    requirements?: {
        credentials?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined;
        dataTables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined;
        workflows?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        agents?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        variables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined;
        tags?: {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined;
        nodeTypes?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined;
    } | undefined;
}>, {
    packageFormatVersion: "1";
    exportedAt: string;
    sourceN8nVersion: string;
    sourceId: string;
    workflows?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    agents?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    folders?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    projects?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    credentials?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    dataTables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    variables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    tags?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    requirements?: {
        credentials?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined;
        dataTables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined;
        workflows?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        agents?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        variables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined;
        tags?: {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined;
        nodeTypes?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined;
    } | undefined;
}, {
    packageFormatVersion: "1";
    exportedAt: string;
    sourceN8nVersion: string;
    sourceId: string;
    workflows?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    agents?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    folders?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    projects?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    credentials?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    dataTables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    variables?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    tags?: {
        id: string;
        name: string;
        target: string;
    }[] | undefined;
    requirements?: {
        credentials?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
            type?: string | undefined;
        }[] | undefined;
        dataTables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name: string;
        }[] | undefined;
        workflows?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        agents?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            id: string;
            name?: string | undefined;
        }[] | undefined;
        variables?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            name: string;
        }[] | undefined;
        tags?: {
            id: string;
            name: string;
            usedBy: {
                id: string;
                kind: "workflow";
            }[];
        }[] | undefined;
        nodeTypes?: {
            usedBy: {
                kind: "agent" | "workflow";
                id: string;
            }[];
            type: string;
            typeVersion: number;
        }[] | undefined;
    } | undefined;
}>;
export type ManifestEntry = z.infer<typeof manifestEntrySchema>;
export type PackageManifest = z.infer<typeof packageManifestSchema>;
